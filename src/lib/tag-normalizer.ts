import compromise from "compromise";

export interface RankedPhrase {
  phrase: string;
  score: number;
}

/**
 * Standardize text format to Title Case.
 * e.g. "large language model" -> "Large Language Model"
 */
export function toTitleCase(str: string): string {
  return str
    .split(/\s+/)
    .map((word) => {
      if (!word) return "";
      // Handle words with hyphen internally, e.g. "self-attention" -> "Self-attention"
      if (word.includes("-")) {
        return word
          .split("-")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join("-");
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

/**
 * Convert a noun phrase to its singular form using compromise.
 * Falls back to basic heuristics if compromise singularization yields empty results.
 */
export function singularizePhrase(phrase: string): string {
  const trimmed = phrase.trim();
  if (!trimmed) return "";

  // 1. If it's a single word, try to Singularize by wrapping it in a context hint
  const words = trimmed.split(/\s+/);
  if (words.length === 1) {
    const singleWord = words[0];
    const doc = compromise(`these ${singleWord}`);
    doc.nouns().toSingular();
    const result = doc.text().trim(); // e.g. "these drone"
    if (result.startsWith("these ")) {
      const singularized = result.slice(6);
      if (singularized && singularized !== singleWord) {
        return singularized;
      }
    }
  } else {
    // Multi-word phrase: compromise is generally very accurate with context
    const doc = compromise(trimmed);
    const nouns = doc.nouns();
    if (nouns.length > 0) {
      nouns.toSingular();
      const singularized = doc.text().trim();
      if (singularized) {
        return singularized;
      }
    }
  }

  // 2. Safe Fallback Heuristic
  const lower = trimmed.toLowerCase();
  if (lower.endsWith("s") && !lower.endsWith("ss")) {
    if (lower.endsWith("ies")) {
      return trimmed.slice(0, -3) + "y"; // e.g. activities -> activity
    }
    if (lower.endsWith("sses")) {
      return trimmed.slice(0, -2); // e.g. bosses -> boss
    }
    if (lower.endsWith("es")) {
      // For words ending in 'es' where it is preceded by ch, sh, x, z
      // e.g. boxes -> box, dishes -> dish, buzzes -> buzz
      const stem = trimmed.slice(0, -2);
      const stemLower = stem.toLowerCase();
      if (
        stemLower.endsWith("ch") ||
        stemLower.endsWith("sh") ||
        stemLower.endsWith("x") ||
        stemLower.endsWith("z")
      ) {
        return stem;
      }
      // For other 'es' words (drones, courses, waves), just strip the 's'
      return trimmed.slice(0, -1);
    }
    return trimmed.slice(0, -1);
  }

  return trimmed;
}

/**
 * Clean specific punctuation characters and extra whitespace.
 */
export function cleanPunctuation(phrase: string): string {
  // Remove special characters, keep only alphanumerics, spaces, and hyphens/underscores
  let cleaned = phrase.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?@'"+|]/g, " ");
  // Collapse spaces
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  return cleaned;
}

/**
 * Normalizes, groups, and deduplicates ranked candidate tags.
 * 
 * Rules:
 * 1. Clean punctuation.
 * 2. Singularize.
 * 3. Convert to Title Case.
 * 4. Deduplicate, keeping the highest score version.
 * 
 * @param rankedCandidates - Scored list of candidate phrases
 * @param minTags - Minimum number of final tags to output (default: 3)
 * @param maxTags - Maximum number of final tags to output (default: 5)
 */
export function normalizeTags(
  rankedCandidates: RankedPhrase[],
  minTags = 3,
  maxTags = 5
): RankedPhrase[] {
  const normalizedMap = new Map<string, number>();

  for (const item of rankedCandidates) {
    // 1. Remove special characters and clean punctuation
    const cleaned = cleanPunctuation(item.phrase);
    if (!cleaned || cleaned.length < 3) continue;

    // 2. Single/Plural normalization (singularize)
    const singular = singularizePhrase(cleaned);
    if (!singular || singular.length < 3) continue;

    // 3. Format as Title Case
    const normalizedKey = toTitleCase(singular);

    // 4 & 5. Keep the highest score for duplicate/grouped keys
    const currentScore = normalizedMap.get(normalizedKey);
    if (currentScore === undefined || item.score > currentScore) {
      normalizedMap.set(normalizedKey, item.score);
    }
  }

  // Convert map back to list, sort by score descending
  const normalizedList: RankedPhrase[] = [];
  normalizedMap.forEach((score, phrase) => {
    normalizedList.push({ phrase, score });
  });

  normalizedList.sort((a, b) => b.score - a.score);

  // Return top 3-5 tags
  const limit = Math.min(Math.max(normalizedList.length, minTags), maxTags);
  return normalizedList.slice(0, limit);
}
