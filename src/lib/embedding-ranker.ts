import { pipeline } from "@huggingface/transformers";

// Use a shared singleton promise for the extractor pipeline to avoid reloading the model on every call.
let extractorInstance: any = null;

async function getExtractor() {
  if (!extractorInstance) {
    // We use all-MiniLM-L6-v2, which is small (~90MB), fast, and performs well for English sentence embeddings.
    extractorInstance = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }
  return extractorInstance;
}

/**
 * Calculates cosine similarity between two vectors.
 */
export function cosineSimilarity(vecA: number[] | Float32Array, vecB: number[] | Float32Array): number {
  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0.0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Generates an embedding vector for a given text.
 * Uses mean pooling to produce a single 384-dimensional vector.
 */
export async function getEmbedding(text: string): Promise<number[]> {
  const extractor = await getExtractor();
  // Generate embeddings using mean pooling and return as a flat array
  const output = await extractor(text, { pooling: "mean", normalize: true });
  return Array.from(output.data);
}

export interface RankedPhrase {
  phrase: string;
  score: number;
}

/**
 * Rank candidate phrases using KeyBERT-like cosine similarity matching against the document.
 * 
 * @param title - Resource title
 * @param content - Resource extracted text/body
 * @param candidates - List of candidate phrases to rank
 * @returns Sorted array of ranked phrases
 */
export async function rankCandidates(
  title: string,
  content: string,
  candidates: string[]
): Promise<RankedPhrase[]> {
  if (candidates.length === 0) {
    return [];
  }

  // 1. Generate Document Embedding from "title + content"
  const documentText = `${title}. ${content}`.trim();
  const documentVector = await getEmbedding(documentText);

  // 2. Generate Keyword Embeddings for each candidate phrase
  const ranked: RankedPhrase[] = [];
  
  // We can do this in parallel or sequentially. To be safe with memory, we can do it in batch or sequence.
  // The pipeline itself supports batch inputs, which is much faster!
  const extractor = await getExtractor();
  const batchOutputs = await extractor(candidates, { pooling: "mean", normalize: true });
  
  // Extract output vectors
  // The output is a Tensor. Its data property holds a flat array of all vectors concatenated.
  // We split this flat array into individual vectors based on the embedding dimension (384).
  const vectorDim = documentVector.length; // should be 384
  const flatData = Array.from(batchOutputs.data) as number[];

  for (let i = 0; i < candidates.length; i++) {
    const startIdx = i * vectorDim;
    const endIdx = startIdx + vectorDim;
    const keywordVector = flatData.slice(startIdx, endIdx);

    // 3. Compute Cosine Similarity between Keyword Vector and Document Vector
    const score = cosineSimilarity(keywordVector, documentVector);
    ranked.push({
      phrase: candidates[i],
      score,
    });
  }

  // 4. Sort by score descending
  return ranked.sort((a, b) => b.score - a.score);
}
