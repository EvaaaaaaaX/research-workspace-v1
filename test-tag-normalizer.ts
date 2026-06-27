import { extractCandidatePhrases } from "./src/lib/candidate-extractor";
import { rankCandidates } from "./src/lib/embedding-ranker";
import { normalizeTags } from "./src/lib/tag-normalizer";

// Markdown 样本数据
const markdownTitle = "Understanding Self-Attention in Transformers";
const markdownContent = `
# Introduction to Self-Attention
We will discuss \`Self-Attention\` and how it works inside **Transformer models**.
Our guide will cover Transformers architecture and positional encoding.
`;

// DOCX 样本数据
const docxTitle = "Project Proposal: Autonomous Drone Navigation System";
const docxContent = `
This project aims to develop a real-time navigation system for autonomous drones using deep reinforcement learning.
The drones need to navigate through complex obstacle courses.
We require camera sensors and edge computing hardware.
`;

// 学术论文 样本数据
const paperTitle = "Attention Is All You Need";
const paperContent = `
Abstract:
The dominant sequence transduction models are based on complex recurrent or convolutional neural networks.
We connect the encoder and decoder through an attention mechanism.
Recurrent neural networks preclude parallelization.
We present the Transformer.
`;

async function testPipeline(title: string, content: string, docType: string) {
  console.log(`\n==================================================`);
  console.log(`Pipeline Test: [${docType}]`);
  console.log(`==================================================`);

  // 1. Candidate Extraction (Task 1)
  const candidateObjects = extractCandidatePhrases(title, content);
  const candidates = candidateObjects.map(c => c.phrase);
  console.log(`[Task 1] Extracted Candidates:`, candidates.slice(0, 10));

  // 2. Embedding Ranking (Task 2)
  const ranked = await rankCandidates(title, content, candidates);
  console.log(`[Task 2] Top Ranked Candidates (Before Normalization):`);
  console.table(ranked.slice(0, 10).map(r => ({ Phrase: r.phrase, Score: r.score.toFixed(4) })));

  // 3. Tag Normalization (Task 3)
  const finalTags = normalizeTags(ranked, 3, 5);
  console.log(`[Task 3] Final Tags (After Normalization, Title Case, Singularized, deduplicated):`);
  console.table(finalTags.map((t, idx) => ({
    Rank: idx + 1,
    Tag: t.phrase,
    Score: t.score.toFixed(4)
  })));
}

async function main() {
  await testPipeline(markdownTitle, markdownContent, "Markdown Document");
  await testPipeline(docxTitle, docxContent, "DOCX Document");
  await testPipeline(paperTitle, paperContent, "Academic Paper");
}

main().catch(err => {
  console.error("Error in normalizer test:", err);
});
