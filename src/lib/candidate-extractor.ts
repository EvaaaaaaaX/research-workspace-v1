import compromise from "compromise";

/**
 * Common stop words to filter out from candidate phrases.
 */
const STOP_WORDS = new Set([
  "the", "and", "is", "of", "for", "in", "to", "a", "with", "on", "as", "by", "an", "at",
  "from", "that", "this", "which", "it", "are", "be", "was", "were", "or", "but", "not",
  "introduction", "conclusion", "paper", "study", "author", "results", "methods", "discussion",
  "fig", "table", "et", "al", "using", "used", "between", "among", "within", "during",
  "also", "many", "well", "even", "still", "back", "however", "therefore", "thus", "hence",
  "although", "though", "while", "where", "when", "what", "where", "who", "whom", "whose",
  "rather", "more", "most", "less", "little", "much", "long", "great", "new", "old"
]);

/**
 * Minimum and maximum character length for a valid candidate phrase.
 */
const MIN_PHRASE_LENGTH = 3;
const MAX_PHRASE_LENGTH = 40;

/**
 * Maximum number of candidate phrases to return.
 */
const MAX_CANDIDATES = 30;
const MIN_CANDIDATES = 10;

/**
 * POS tags to exclude from candidate phrases.
 * compromise uses extended Part-Of-Speech tags.
 */
const EXCLUDED_TAGS = new Set([
  // Verbs
  "Verb", "Verb: past tense", "Verb: present tense", "Verb: participle",
  "Verb: gerund",
  // Adjectives
  "Adjective", "Adjective: comparative", "Adjective: superlative",
  // Adverbs
  "Adverb", "Adverb: comparative", "Adverb: superlative",
  // Other non-noun POS
  "Determiner", "Preposition", "Conjunction", "Pronoun", "Possessive",
  "Interjection", "Particle", "Article", "Degree",
]);

/**
 * Result of candidate phrase extraction.
 */
export interface CandidatePhrase {
  /** The extracted phrase */
  phrase: string;
  /** Source text the phrase came from */
  source: "title" | "content";
  /** Optional: number of noun terms in the phrase */
  termCount?: number;
}

/**
 * Clean text by removing Markdown syntax, HTML tags, URLs, and collapsing whitespace.
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
 * Check if a phrase contains only stop words or is too short.
 */
function isValidPhrase(phrase: string): boolean {
  if (!phrase || phrase.length < MIN_PHRASE_LENGTH || phrase.length > MAX_PHRASE_LENGTH) {
    return false;
  }

  const words = phrase.toLowerCase().split(/\s+/);
  const nonStopWords = words.filter((w) => !STOP_WORDS.has(w));
  
  // At least one non-stop word required
  return nonStopWords.length > 0;
}

/**
 * Filter terms by POS, excluding verbs, adjectives, adverbs, etc.
 */
function filterTermsByPOS(terms: any[]): string[] {
  return terms
    .filter((t: any) => {
      const tags = t.tags || [];
      // Exclude non-noun POS
      return !tags.some((tag: string) => EXCLUDED_TAGS.has(tag));
    })
    .map((t: any) => t.text);
}

/**
 * Extract candidate noun phrases from a compromise document.
 * Returns unique phrases sorted by term count (longer phrases first).
 */
function extractNounPhrases(doc: any): string[] {
  const phrasesSet = new Set<string>();

  // Get noun phrases (multi-word)
  const nounPhrases = doc.nouns().json();
  for (const item of nounPhrases) {
    const terms = item.terms || [];
    if (terms.length === 0) continue;

    const filtered = filterTermsByPOS(terms);
    const phrase = filtered.join(" ").trim();

    if (phrase && isValidPhrase(phrase)) {
      // Normalize whitespace
      const normalized = phrase.replace(/\s+/g, " ");
      phrasesSet.add(normalized);
    }
  }

  // Also get single nouns for coverage
  const singleNouns = doc.nouns().json();
  for (const item of singleNouns) {
    const terms = item.terms || [];
    for (const term of terms) {
      const filtered = filterTermsByPOS([term]);
      if (filtered.length > 0) {
        const word = filtered[0].trim();
        if (word && isValidPhrase(word) && word.length >= 3) {
          phrasesSet.add(word.toLowerCase());
        }
      }
    }
  }

  // Sort: prefer longer phrases (more informative)
  return Array.from(phrasesSet).sort((a, b) => b.split(" ").length - a.split(" ").length);
}

/**
 * Extract candidate phrases from a single text source.
 */
function extractFromSource(
  text: string,
  source: "title" | "content"
): CandidatePhrase[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  const cleaned = cleanText(text);
  if (cleaned.length === 0) {
    return [];
  }

  const doc = compromise(cleaned);
  const phrases = extractNounPhrases(doc);

  return phrases.map((phrase) => ({
    phrase,
    source,
    termCount: phrase.split(" ").length,
  }));
}

/**
 * Extract candidate keyword phrases from title and content.
 * 
 * Priority: title phrases come first, then content phrases.
 * Deduplicates by lowering case to avoid "Transformer" vs "transformer".
 * 
 * @param title - Resource title
 * @param content - Resource extracted text/body
 * @returns Array of 10-30 candidate phrases with source attribution
 */
export function extractCandidatePhrases(
  title: string,
  content: string
): CandidatePhrase[] {
  // Extract from both sources
  const titleCandidates = extractFromSource(title, "title");
  const contentCandidates = extractFromSource(content, "content");

  // Combine: title first (higher priority), then content
  const combined = [...titleCandidates, ...contentCandidates];

  // Deduplicate by lowercase phrase
  const seen = new Set<string>();
  const unique: CandidatePhrase[] = [];

  for (const candidate of combined) {
    const key = candidate.phrase.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(candidate);
    }
  }

  // Limit to MAX_CANDIDATES, ensure at least MIN_CANDIDATES if available
  const limit = Math.min(Math.max(unique.length, MIN_CANDIDATES), MAX_CANDIDATES);
  return unique.slice(0, limit);
}

/**
 * Convenience function to extract candidates from a single text block.
 */
export function extractCandidatesFromSingleText(
  text: string,
  source: "title" | "content" = "content"
): CandidatePhrase[] {
  return extractFromSource(text, source);
}
