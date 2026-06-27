import { prisma } from "./prisma";
import natural from "natural";
// @ts-ignore
import RAKE from "rake-js";
// @ts-ignore
import compromise from "compromise";
import { YakeExtractor } from "./yake";
import { extractCandidatePhrases } from "./candidate-extractor";
import { rankCandidates } from "./embedding-ranker";
import { normalizeTags } from "./tag-normalizer";

const TfIdf = natural.TfIdf;
const tokenizer = new natural.WordTokenizer();

export const STOP_WORDS = new Set([
  "the", "and", "is", "of", "for", "in", "to", "a", "with", "on", "as", "by", "an", "at",
  "from", "that", "this", "which", "it", "are", "be", "was", "were", "or", "but", "not",
  "introduction", "conclusion", "paper", "study", "author", "results", "methods", "discussion",
  "fig", "table", "et", "al", "using", "used", "between", "among", "within", "during"
]);

const WEIGHTS = {
  EXTRACTED_TEXT: 4,
  TITLE: 2,
  KEYWORDS: 2,
  ABSTRACT: 2,
};

/**
 * Clean Markdown syntax, remove URLs, and collapse multiple spaces.
 */
export function cleanText(text: string): string {
  if (!text) return "";

  let cleaned = text;

  // 1. Remove HTTP/HTTPS URLs
  cleaned = cleaned.replace(/https?:\/\/[^\s]+/gi, "");

  // 2. Clean Markdown markup
  // Remove code blocks
  cleaned = cleaned.replace(/```[\s\S]*?```/g, "");
  // Remove inline code
  cleaned = cleaned.replace(/`([^`]+)`/g, "$1");
  // Remove images and links markdown, keeping the anchor text
  cleaned = cleaned.replace(/!?\[([^\]]*)\]\([^\)]*\)/g, "$1");
  // Remove HTML tags
  cleaned = cleaned.replace(/<[^>]*>/g, "");
  // Remove headings (e.g. # Header)
  cleaned = cleaned.replace(/^\s*#+\s+/gm, "");
  // Remove bullet points, blockquotes, list markers
  cleaned = cleaned.replace(/^\s*[-*+>\s]+\s*/gm, "");
  cleaned = cleaned.replace(/^\s*\d+\.\s+/gm, "");
  // Remove bold, italic, strikethrough markdown markup
  cleaned = cleaned.replace(/[*_~]{1,3}/g, "");

  // 3. Remove multiple spaces and newlines
  cleaned = cleaned.replace(/\s+/g, " ");

  return cleaned.trim();
}

/**
 * Normalizes a tag string to Title Case.
 */
function normalizeTagFormat(tag: string): string {
  return tag
    .split(/[\s_-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * TextRank Algorithm Implementation (Word Graph PageRank)
 */
export function runTextRank(
  text: string,
  windowSize = 5,
  iterations = 25,
  damping = 0.85
): Record<string, number> {
  const wordRegex = /[a-zA-Z0-9_\u4e00-\u9fa5]+/g;
  const rawWords = text.match(wordRegex) || [];
  const words: string[] = [];

  for (const w of rawWords) {
    const lower = w.toLowerCase();
    if (lower.length < 3 && !/[\u4e00-\u9fa5]/.test(lower)) continue;
    if (STOP_WORDS.has(lower)) continue;
    words.push(lower);
  }

  if (words.length === 0) return {};

  const vertices = new Set<string>(words);
  const graph: Record<string, Set<string>> = {};
  const edgeWeights: Record<string, number> = {};

  for (const v of vertices) {
    graph[v] = new Set<string>();
  }

  for (let i = 0; i < words.length; i++) {
    const limit = Math.min(words.length, i + windowSize);
    for (let j = i + 1; j < limit; j++) {
      const w1 = words[i];
      const w2 = words[j];
      if (w1 === w2) continue;

      const key = w1 < w2 ? `${w1}:${w2}` : `${w2}:${w1}`;
      edgeWeights[key] = (edgeWeights[key] || 0) + 1;

      graph[w1].add(w2);
      graph[w2].add(w1);
    }
  }

  const scoreMap: Record<string, number> = {};
  for (const v of vertices) {
    scoreMap[v] = 1.0;
  }

  const outSum: Record<string, number> = {};
  for (const v of vertices) {
    let sum = 0;
    for (const neighbor of graph[v]) {
      const key = v < neighbor ? `${v}:${neighbor}` : `${neighbor}:${v}`;
      sum += edgeWeights[key] || 0;
    }
    outSum[v] = sum;
  }

  for (let iter = 0; iter < iterations; iter++) {
    const nextScores: Record<string, number> = {};
    for (const v of vertices) {
      let sum = 0;
      for (const neighbor of graph[v]) {
        const key = v < neighbor ? `${v}:${neighbor}` : `${neighbor}:${v}`;
        const w_ji = edgeWeights[key] || 0;
        const sum_w_jk = outSum[neighbor] || 1;
        sum += (w_ji / sum_w_jk) * scoreMap[neighbor];
      }
      nextScores[v] = (1 - damping) + damping * sum;
    }

    for (const v of vertices) {
      scoreMap[v] = nextScores[v];
    }
  }

  return scoreMap;
}

/**
 * Min-Max Score Normalization to [0, 1]
 */
function normalizeScores(scores: Record<string, number>): Record<string, number> {
  const entries = Object.entries(scores);
  if (entries.length === 0) return {};
  
  const values = entries.map(([_, v]) => v);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const diff = max - min;
  
  const normalized: Record<string, number> = {};
  for (const [k, v] of entries) {
    normalized[k] = diff === 0 ? 1.0 : (v - min) / diff;
  }
  return normalized;
}

/**
 * Standardize and deduplicate tags (combines plurals & modifiers, e.g., Transformers -> Transformer)
 */
export function normalizeAndDeduplicateTags(scores: Record<string, number>): Record<string, number> {
  const deduplicated: Record<string, number> = {};
  // Sort from shortest length to longest
  const sortedKeys = Object.keys(scores).sort((a, b) => a.length - b.length);

  const skipSuffixes = ["models", "model", "framework", "frameworks", "guides", "guide", "systems", "system", "algorithms", "algorithm"];

  for (const key of sortedKeys) {
    const score = scores[key];
    const normalizedKey = key.trim();
    if (!normalizedKey) continue;

    const lowerKey = normalizedKey.toLowerCase();
    let merged = false;

    for (const existingKey of Object.keys(deduplicated)) {
      const existingLower = existingKey.toLowerCase();

      // 1. Plural merging
      if (
        lowerKey === existingLower + "s" ||
        lowerKey === existingLower + "es" ||
        existingLower === lowerKey + "s" ||
        existingLower === lowerKey + "es"
      ) {
        const targetKey = existingKey.length < normalizedKey.length ? existingKey : normalizedKey;
        const targetValue = (deduplicated[existingKey] || 0) + score;
        
        if (targetKey !== existingKey) {
          delete deduplicated[existingKey];
        }
        deduplicated[targetKey] = targetValue;
        merged = true;
        break;
      }

      // 2. Modifier merging (e.g. "Transformer Models" -> "Transformer")
      if (lowerKey.startsWith(existingLower + " ")) {
        const suffix = lowerKey.slice(existingLower.length).trim();
        if (skipSuffixes.includes(suffix)) {
          deduplicated[existingKey] = (deduplicated[existingKey] || 0) + score;
          merged = true;
          break;
        }
      }
    }

    if (!merged) {
      deduplicated[normalizedKey] = score;
    }
  }

  return deduplicated;
}

/**
 * Helper to extract tags directly from text inputs.
 */
/**
 * Helper to extract tags directly from text inputs.
 */
export function extractTagsFromText(
  title: string,
  keywordsStr: string,
  abstractStr: string,
  extractedText: string
): string[] {
  const cleanTitle = cleanText(title);
  const cleanFullText = cleanText(extractedText);
  const combinedText = (cleanTitle + ". " + cleanFullText).trim();

  if (!combinedText) return [];

  // --- Step 1: POS Filtering & Candidate Phrase Extraction via compromise ---
  const doc = compromise(combinedText);
  // Match nouns, proper nouns, and noun phrases
  const nounPhrases = doc.nouns().json();
  const candidatesSet = new Set<string>();

  for (const item of nounPhrases) {
    const terms = item.terms || [];
    const filteredTerms = terms.filter((t: any) => {
      const tags = t.tags || [];
      // Filter out determiners, prepositions, conjunctions, verbs, adverbs, pronouns, possessives
      return !tags.includes("Determiner") && 
             !tags.includes("Preposition") && 
             !tags.includes("Conjunction") &&
             !tags.includes("Pronoun") &&
             !tags.includes("Possessive") &&
             !tags.includes("Verb") &&
             !tags.includes("Adverb");
    });

    const candidate = filteredTerms.map((t: any) => t.text).join(" ").trim();
    const cleanCandidate = candidate.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "").replace(/\s+/g, " ").trim();
    
    // Validate candidates: length check and stop word check
    if (cleanCandidate && cleanCandidate.length >= 3 && cleanCandidate.length <= 40) {
      const lower = cleanCandidate.toLowerCase();
      const words = lower.split(" ");
      const nonStopWords = words.filter((w: string) => !STOP_WORDS.has(w));
      if (nonStopWords.length > 0) {
        candidatesSet.add(normalizeTagFormat(cleanCandidate));
      }
    }
  }

  // Fallback in case POS filtering yields no candidates
  if (candidatesSet.size === 0) {
    const wordRegex = /[a-zA-Z0-9_\u4e00-\u9fa5]+/g;
    const words = combinedText.match(wordRegex) || [];
    for (const w of words) {
      if (w.length >= 3 && !STOP_WORDS.has(w.toLowerCase())) {
        candidatesSet.add(normalizeTagFormat(w));
      }
    }
  }

  const candidatePhrases = Array.from(candidatesSet);

  // --- Step 2: YAKE Score Calculation ---
  const yakeExtractor = new YakeExtractor(combinedText, 3, candidatesSet);
  const yakeResults = yakeExtractor.extract();
  
  // YAKE returns scores where lower is better (0 is best, higher is worse).
  const yakeScores: Record<string, number> = {};
  for (const item of yakeResults) {
    yakeScores[item.keyword] = item.score;
  }

  // Provide defaults for candidates that YAKE didn't score
  for (const candidate of candidatePhrases) {
    if (yakeScores[candidate] === undefined) {
      yakeScores[candidate] = 1.0; // Worst score
    }
  }

  // --- Step 3: TextRank Score Calculation ---
  const textRankScoresRaw = runTextRank(combinedText);
  const textRankScores: Record<string, number> = {};

  // Compute phrase scores by averaging constituent word TextRank scores
  for (const phrase of candidatePhrases) {
    const parts = phrase.toLowerCase().split(/\s+/);
    let sum = 0;
    let count = 0;
    for (const part of parts) {
      const cleanPart = part.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"']/g, "");
      if (textRankScoresRaw[cleanPart] !== undefined) {
        sum += textRankScoresRaw[cleanPart];
        count++;
      }
    }
    if (count > 0) {
      textRankScores[phrase] = sum / count;
    } else {
      textRankScores[phrase] = 0.0;
    }
  }

  // --- Step 4: Min-Max Score Normalization & Alignment ---
  // Normalizing YAKE: since lower is better, we must invert: 1.0 - normalizedYake
  // For TextRank, higher is better, so it remains normalizedTextRank
  const normYake: Record<string, number> = {};
  const normTextRank: Record<string, number> = {};

  const yakeVals = Object.values(yakeScores);
  const textRankVals = Object.values(textRankScores);

  const minYake = yakeVals.length > 0 ? Math.min(...yakeVals) : 0;
  const maxYake = yakeVals.length > 0 ? Math.max(...yakeVals) : 1;
  const diffYake = maxYake - minYake;

  const minTR = textRankVals.length > 0 ? Math.min(...textRankVals) : 0;
  const maxTR = textRankVals.length > 0 ? Math.max(...textRankVals) : 1;
  const diffTR = maxTR - minTR;

  for (const term of candidatePhrases) {
    const rawYake = yakeScores[term] ?? 1.0;
    const normYakeVal = diffYake === 0 ? 0.0 : (rawYake - minYake) / diffYake;
    normYake[term] = 1.0 - normYakeVal; // Inverted: 1 is best, 0 is worst

    const rawTR = textRankScores[term] ?? 0.0;
    normTextRank[term] = diffTR === 0 ? 1.0 : (rawTR - minTR) / diffTR; // Higher is better
  }

  // Apply normalization and tag deduplication / canonicalization on individual maps first
  const cleanNormYake = normalizeAndDeduplicateTags(normYake);
  const cleanNormTextRank = normalizeAndDeduplicateTags(normTextRank);

  // --- Step 5: Score Fusion ---
  // YAKE: 60%, TextRank: 40%
  const fusedScores: Record<string, number> = {};
  const allTerms = new Set([
    ...Object.keys(cleanNormYake),
    ...Object.keys(cleanNormTextRank)
  ]);

  for (const term of allTerms) {
    const yScore = cleanNormYake[term] || 0;
    const trScore = cleanNormTextRank[term] || 0;
    fusedScores[term] = (0.60 * yScore) + (0.40 * trScore);
  }

  // Normalize final fused scores one last time and canonicalize
  const finalScoreMap = normalizeAndDeduplicateTags(fusedScores);

  // --- Step 6: Select final 3-5 tags ---
  const sortedTags = Object.entries(finalScoreMap)
    .sort((a, b) => b[1] - a[1]);

  const finalTags = sortedTags.slice(0, 5).map(([name]) => name);

  // Logging detailed outputs for validation
  console.log("[Tag Generation Log] --- Candidate Keywords (from POS) ---");
  console.log(candidatePhrases.slice(0, 20));
  
  console.log("[Tag Generation Log] --- YAKE Raw Scores (Top 15, lower is better) ---");
  console.log(Object.entries(yakeScores).sort((a, b) => a[1] - b[1]).slice(0, 15));
  
  console.log("[Tag Generation Log] --- TextRank Raw Scores (Top 15, higher is better) ---");
  console.log(Object.entries(textRankScores).sort((a, b) => b[1] - a[1]).slice(0, 15));
  
  console.log("[Tag Generation Log] --- Score Fusion Result (Top 15) ---");
  console.log(Object.entries(finalScoreMap).sort((a, b) => b[1] - a[1]).slice(0, 15));
  
  console.log("[Tag Generation Log] --- Final Selected Tags (3-5) ---");
  console.log(finalTags);

  return finalTags;
}

/**
 * Unified pipeline to generate semantic automatic tags using Transformers.js KeyBERT-like ranker.
 * Falls back to legacy text tag extraction if any step fails.
 */
export async function generateSemanticAutoTags(title: string, content: string): Promise<string[]> {
  try {
    const candidates = extractCandidatePhrases(title, content);
    if (candidates.length === 0) {
      throw new Error("No candidate phrases extracted.");
    }
    const phrasesOnly = candidates.map(c => c.phrase);
    const ranked = await rankCandidates(title, content, phrasesOnly);
    const normalized = normalizeTags(ranked, 3, 5);
    return normalized.map(t => t.phrase);
  } catch (error) {
    console.error("[Tag Pipeline] Semantic Auto Tags failed, falling back to legacy tagger:", error);
    // Legacy fallback using original extractTagsFromText
    return extractTagsFromText(title, "", "", content);
  }
}

/**
 * Main entry point for generating tags for a resource.
 */
export async function generateTagsForResource(resourceId: string, clearExisting = false) {
  const resource = await prisma.resource.findUnique({
    where: { id: resourceId, deletedAt: null },
    include: {
      content: true,
      metadataStructured: true,
      tags: {
        where: { source: "MANUAL" }
      }
    },
  });

  if (!resource) return;

  const topTags = await generateSemanticAutoTags(
    resource.title,
    resource.content?.extractedText || ""
  );

  // 4. Update database
  if (clearExisting) {
    // Delete existing AUTO tags
    await prisma.resourceTag.deleteMany({
      where: {
        resourceId: resource.id,
        source: "AUTO",
      },
    });
  }

  for (const tagName of topTags) {
    // Upsert Tag
    const tag = await prisma.tag.upsert({
      where: { name: tagName },
      update: {},
      create: {
        name: tagName,
        normalizedName: tagName.toLowerCase(),
        sourceType: "AUTO",
      },
    });

    // Link Tag to Resource (avoid duplicates with existing MANUAL tags)
    await prisma.resourceTag.upsert({
      where: {
        resourceId_tagId: {
          resourceId: resource.id,
          tagId: tag.id,
        },
      },
      update: {},
      create: {
        resourceId: resource.id,
        tagId: tag.id,
        source: "AUTO",
        confidence: 1.0,
      },
    });
  }
}

/**
 * Placeholder for seeding (now less relevant as we use dynamic extraction)
 */
export async function seedDefaultTagRules() {
  console.log("Tag generation is now dynamic based on content.");
}
