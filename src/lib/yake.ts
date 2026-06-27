import { STOP_WORDS, cleanText } from "./tag-service";

export interface YakeResult {
  keyword: string;
  score: number; // Yake score: lower is better/more important
}

/**
 * High-fidelity pure TypeScript implementation of the YAKE! (Yet Another Keyword Extractor) algorithm.
 * Strictly follows the feature engineering design defined by Campos et al.
 */
export class YakeExtractor {
  private text: string;
  private maxNgram: number;
  private candidates: Set<string> | null = null;
  
  constructor(text: string, maxNgram = 3, candidates: Set<string> | null = null) {
    this.text = cleanText(text);
    this.maxNgram = maxNgram;
    this.candidates = candidates;
  }

  /**
   * Run YAKE algorithm to extract keywords with their scores
   */
  public extract(): YakeResult[] {
    if (!this.text) return [];

    // 1. Split sentences and tokenize
    // Handles sentence boundary identification
    const sentenceRegex = /[^.!?。！？]+[.!?。！？]+/g;
    let sentences: string[] = [];
    const matchedSentences = this.text.match(sentenceRegex);
    if (matchedSentences && matchedSentences.length > 0) {
      sentences = matchedSentences.map(s => s.trim()).filter(Boolean);
    } else {
      sentences = this.text.split(/[.\n]/).map(s => s.trim()).filter(Boolean);
    }

    const wordRegex = /[a-zA-Z0-9_\u4e00-\u9fa5]+/g;
    const sentenceTokens: string[][] = sentences.map(s => s.match(wordRegex) || []);
    const allTokens = sentenceTokens.flat();
    const totalTokens = allTokens.length;

    if (totalTokens === 0) return [];

    // 2. Count basic statistics
    const tfMap: Record<string, number> = {};
    const uppercaseCount: Record<string, number> = {};
    const sentenceCount: Record<string, number> = {};
    const firstPosition: Record<string, number> = {};

    // For context calculations (T_rel)
    const leftContext: Record<string, Set<string>> = {};
    const rightContext: Record<string, Set<string>> = {};

    for (let sIdx = 0; sIdx < sentenceTokens.length; sIdx++) {
      const tokens = sentenceTokens[sIdx];
      const seenInSentence = new Set<string>();

      for (let tIdx = 0; tIdx < tokens.length; tIdx++) {
        const token = tokens[tIdx];
        const lowerToken = token.toLowerCase();
        
        // TF
        tfMap[lowerToken] = (tfMap[lowerToken] || 0) + 1;

        // Position (first occurrence offset)
        if (firstPosition[lowerToken] === undefined) {
          firstPosition[lowerToken] = allTokens.indexOf(token);
        }

        // Sentence frequency
        if (!seenInSentence.has(lowerToken)) {
          sentenceCount[lowerToken] = (sentenceCount[lowerToken] || 0) + 1;
          seenInSentence.add(lowerToken);
        }

        // Capitalization
        const isUppercase = /^[A-Z]+$/.test(token);
        const isCapitalized = /^[A-Z][a-z0-9]*$/.test(token);
        // Exclude start-of-sentence capitalization biases
        if (tIdx > 0 && (isUppercase || isCapitalized)) {
          uppercaseCount[lowerToken] = (uppercaseCount[lowerToken] || 0) + 1;
        }

        // Context (window = 2)
        if (!leftContext[lowerToken]) leftContext[lowerToken] = new Set();
        if (!rightContext[lowerToken]) rightContext[lowerToken] = new Set();

        if (tIdx > 0) {
          leftContext[lowerToken].add(tokens[tIdx - 1].toLowerCase());
        }
        if (tIdx < tokens.length - 1) {
          rightContext[lowerToken].add(tokens[tIdx + 1].toLowerCase());
        }
      }
    }

    // Mean and standard deviation of TF
    const tfValues = Object.values(tfMap);
    const meanTf = tfValues.reduce((a, b) => a + b, 0) / tfValues.length;
    const varianceTf = tfValues.reduce((sum, val) => sum + Math.pow(val - meanTf, 2), 0) / tfValues.length;
    const stdDevTf = Math.sqrt(varianceTf);

    // 3. Compute single-word (unigram) YAKE features
    const wordScores: Record<string, number> = {};
    const vocab = Object.keys(tfMap);

    for (const w of vocab) {
      const tf = tfMap[w];
      
      // Feature 1: Casing (T_case)
      const uCount = uppercaseCount[w] || 0;
      const tCase = 1 + (uCount / (1 + Math.log(tf)));

      // Feature 2: Position (T_position)
      const firstPos = firstPosition[w] || 0;
      const tPosition = 1 + Math.log(1 + Math.log(firstPos + 1));

      // Feature 3: Frequency (T_freq)
      const tFreq = tf / (meanTf + 1.5 * stdDevTf);

      // Feature 4: Relatedness to Context (T_rel)
      const dl = leftContext[w]?.size || 0;
      const dr = rightContext[w]?.size || 0;
      const tRel = 1 + (dl / tf + dr / tf);

      // Feature 5: Sentence Frequency (T_sentence)
      const sf = sentenceCount[w] || 0;
      const tSentence = 1 + (sf / sentenceTokens.length);

      // Core YAKE formula: score = (T_case * T_position) / (T_freq + (T_rel / S_case) + (T_sentence / S_case))
      // A lower score is better (represents a more distinctive word)
      const score = (tCase * tPosition) / (tFreq + (tRel / tCase) + (tSentence / tCase));
      wordScores[w] = isNaN(score) ? 1.0 : score;
    }

    // 4. Generate candidate n-gram phrases (1 to maxNgram) or evaluate pre-filtered candidates
    const phraseScores: Record<string, number> = {};

    if (this.candidates) {
      for (const phrase of this.candidates) {
        const slice = phrase.match(/[a-zA-Z0-9_\u4e00-\u9fa5]+/g) || [];
        if (slice.length === 0) continue;
        const firstWord = slice[0];
        const lastWord = slice[slice.length - 1];
        if (firstWord && lastWord && (STOP_WORDS.has(firstWord.toLowerCase()) || STOP_WORDS.has(lastWord.toLowerCase()))) {
          continue;
        }

        const normalizedPhrase = phrase.toLowerCase();
        let termProduct = 1.0;
        let termSum = 0.0;
        let validWords = 0;

        for (const word of slice) {
          const lowerW = word.toLowerCase();
          const wScore = wordScores[lowerW];
          if (wScore !== undefined) {
            termProduct *= wScore;
            termSum += wScore;
            validWords++;
          }
        }

        if (validWords === 0) continue;
        const freq = tfMap[normalizedPhrase] || 1;
        const phraseScore = termProduct / (freq * (1 + termSum));
        phraseScores[phrase] = phraseScore;
      }
    } else {
      for (const tokens of sentenceTokens) {
        for (let n = 1; n <= this.maxNgram; n++) {
          for (let i = 0; i <= tokens.length - n; i++) {
            const slice = tokens.slice(i, i + n);
            
            // Filter start/end stop words
            const firstWord = slice[0];
            const lastWord = slice[slice.length - 1];
            if (firstWord && lastWord && (STOP_WORDS.has(firstWord.toLowerCase()) || STOP_WORDS.has(lastWord.toLowerCase()))) {
              continue;
            }

            const phrase = slice.join(" ");
            const normalizedPhrase = phrase.toLowerCase();
            
            // Calculate n-gram YAKE score
            let termProduct = 1.0;
            let termSum = 0.0;
            let validWords = 0;

            for (const word of slice) {
              const lowerW = word.toLowerCase();
              const wScore = wordScores[lowerW];
              if (wScore !== undefined) {
                termProduct *= wScore;
                termSum += wScore;
                validWords++;
              }
            }

            if (validWords === 0) continue;

            // Multi-word phrase core score formula (Campos et al.)
            // Penalize by co-occurrence frequency to prevent phrase splitting bias
            const freq = tfMap[normalizedPhrase] || 1;
            const phraseScore = termProduct / (freq * (1 + termSum));

            phraseScores[phrase] = phraseScore;
          }
        }
      }
    }

    // 5. Build results list and sort (ascending score: most important first)
    const results = Object.entries(phraseScores).map(([kw, score]) => ({
      keyword: kw,
      score: score
    }));

    results.sort((a, b) => a.score - b.score);

    return results;
  }
}
