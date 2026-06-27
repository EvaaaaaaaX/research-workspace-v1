import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import * as cheerio from "cheerio";
import { STOP_WORDS, cleanText } from "./tag-service";

/**
 * Extracts text from a file buffer based on its extension.
 */
export async function extractTextFromFile(buffer: Buffer, extension: string): Promise<string> {
  const ext = extension.toLowerCase().replace(".", "");

  try {
    switch (ext) {
      case "pdf": {
        const { PDFParse } = await import("pdf-parse");
        const parser = new PDFParse({ data: buffer });
        const result = await parser.getText();
        return result.text || "";
      }
      case "docx": {
        // Dynamic import to avoid ESM/CJS issues
        const mammothMod = await import("mammoth");
        const result = await mammothMod.extractRawText({ buffer });
        return result.value || "";
      }
      case "txt":
      case "md":
      case "markdown": {
        return buffer.toString("utf-8");
      }
      default:
        return "";
    }
  } catch (error) {
    console.error(`[PDF Extraction Error] Extension: ${ext}, Error: ${error instanceof Error ? error.constructor.name : "Unknown"}, Message: ${error instanceof Error ? error.message : String(error)}`);
    return "";
  }
}

/**
 * Fetches and extracts content and metadata from a URL.
 */
export async function extractContentFromUrl(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }

    const html = await response.text();
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    const $ = cheerio.load(html);

    // Extract metadata from meta tags
    const metadata = {
      title: article?.title || $("title").text() || "",
      description: article?.excerpt || $('meta[name="description"]').attr("content") || "",
      siteName: article?.siteName || $('meta[property="og:site_name"]').attr("content") || "",
      authors: article?.byline || $('meta[name="author"]').attr("content") || "",
      content: article?.textContent || "",
      canonicalUrl: $('link[rel="canonical"]').attr("href") || url,
      // Attempt to find academic identifiers
      doi: $('meta[name="citation_doi"]').attr("content") || $('meta[name="dc.identifier"]').attr("content") || "",
      journal: $('meta[name="citation_journal_title"]').attr("content") || "",
      publisher: $('meta[name="citation_publisher"]').attr("content") || "",
      publicationYear: parseInt($('meta[name="citation_publication_date"]').attr("content")?.split("/")[0] || "") || null,
    };

    return metadata;
  } catch (error) {
    console.error("Error extracting content from URL:", error);
    return null;
  }
}

/**
 * Basic metadata extraction from text (heuristic based)
 */
export function extractMetadataFromText(text: string) {
  const metadata: any = {};

  // DOI Regex
  const doiRegex = /\b(10[.][0-9]{4,}(?:[.][0-9]+)*\/(?:(?!["&\'<>])\S)+)\b/i;
  const doiMatch = text.match(doiRegex);
  if (doiMatch) metadata.doi = doiMatch[1];

  // ArXiv Regex
  const arxivRegex = /arXiv:(\d{4}\.\d{4,5}(?:v\d+)?)/i;
  const arxivMatch = text.match(arxivRegex);
  if (arxivMatch) metadata.arxivId = arxivMatch[1];

  // ISBN Regex
  const isbnRegex = /ISBN(?:-13|:?\s+)?((?:97[89])?\d{9}[\dxX])/i;
  const isbnMatch = text.match(isbnRegex);
  if (isbnMatch) metadata.isbn = isbnMatch[1];

  return metadata;
}

/**
 * Generates an extractive summary of 2-3 sentences from the given text without using an LLM.
 */
export function generateSummary(text: string): string {
  if (!text) return "";

  // 1. Clean the text using the standard cleaner
  const cleanedText = cleanText(text);

  // 2. Split text into sentences.
  // Handles English periods, Chinese full-stops, question marks, and exclamation marks.
  const sentenceRegex = /[^.!?。！？]+[.!?。！？]+/g;
  let sentences: string[] = (cleanedText.match(sentenceRegex) || []) as string[];
  
  // If match failed, try fallback splitting by newlines or simple periods
  if (sentences.length === 0) {
    sentences = cleanedText.split(/[.\n]/).map(s => s.trim()).filter(Boolean);
  } else {
    sentences = sentences.map(s => s.trim()).filter(Boolean);
  }

  if (sentences.length <= 3) {
    return sentences.join(" ");
  }

  // 3. Tokenize and count word frequencies (TF) to find key terms
  const wordFreqs: Record<string, number> = {};
  // Simple word extraction regex that matches English words and Chinese characters
  const wordRegex = /[a-zA-Z0-9_\u4e00-\u9fa5]+/g;
  const words = cleanedText.match(wordRegex) || [];

  for (const word of words) {
    const lowerWord = word.toLowerCase();
    if (lowerWord.length < 3 && !/[\u4e00-\u9fa5]/.test(lowerWord)) continue; // ignore short English words
    if (STOP_WORDS.has(lowerWord)) continue; // skip stop words

    wordFreqs[lowerWord] = (wordFreqs[lowerWord] || 0) + 1;
  }

  // 4. Score each sentence based on the frequency of its key terms
  // Sentence Score = sum(word_frequencies) / (word_count_in_sentence + 1)
  const sentenceScores = sentences.map((sentence, index) => {
    const sWords = sentence.match(wordRegex) || [];
    let score = 0;

    for (const word of sWords) {
      const lowerWord = word.toLowerCase();
      if (wordFreqs[lowerWord]) {
        score += wordFreqs[lowerWord];
      }
    }

    // Normalize by length of the sentence to avoid bias towards longer sentences
    const normalizedScore = score / (sWords.length + 1);
    
    return {
      index,
      text: sentence,
      score: normalizedScore
    };
  });

  // 5. Sort sentences by score and pick top 3
  const topSentences = [...sentenceScores]
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  // 6. Sort the chosen top sentences by their original index to maintain readability
  topSentences.sort((a, b) => a.index - b.index);

  return topSentences.map(s => s.text).join(" ");
}

/**
 * Gets a clean preview of the text up to specified length.
 */
export function getContentPreview(text: string, length = 300): string {
  if (!text) return "";
  const cleaned = cleanText(text);
  if (cleaned.length <= length) return cleaned;
  return cleaned.slice(0, length) + "...";
}
