import { extractCandidatePhrases } from "./src/lib/candidate-extractor";

// 1. Markdown 样本数据
const markdownTitle = "Understanding Self-Attention in Transformers";
const markdownContent = `
# Introduction to Self-Attention

Here is an image: ![transformer architecture](https://example.com/transformer.png)
And a link: [Attention Is All You Need](https://arxiv.org/abs/1706.03762)

We will discuss \`Self-Attention\` and how it works inside **Transformer models**.

\`\`\`typescript
function calculateAttention(Q, K, V) {
  // Simple dot-product attention
  const scores = matmul(Q, transpose(K));
  const weights = softmax(scores);
  return matmul(weights, V);
}
\`\`\`

## Key Concepts
* **Query, Key, Value vectors**
* Multi-Head Attention mechanism
* Positional Encoding

For more details, visit our blog at https://example.com/blog/self-attention.
`;

// 2. DOCX 样本数据 (通常是Mammoth转换出来的纯文本，多余换行已被处理或保留)
const docxTitle = "Project Proposal: Autonomous Drone Navigation System";
const docxContent = `
Project Proposal: Autonomous Drone Navigation System

This project aims to develop a real-time navigation system for autonomous drones using deep reinforcement learning.
The drone needs to navigate through complex obstacle courses without human intervention.

System Requirements:
1. High-resolution camera sensors
2. Edge computing hardware (NVIDIA Jetson)
3. Real-time obstacle avoidance algorithms
4. GPS-denied localization methods

Expected Deliverables:
- Prototype flight control software
- Simulation environment using Unreal Engine
- Performance benchmark reports
`;

// 3. 学术论文 样本数据
const paperTitle = "Attention Is All You Need";
const paperContent = `
Abstract
The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.

Introduction
Recurrent models, such as long short-term memory (LSTM) and gated recurrent (GRU) neural networks, have been firmly established as state-of-the-art approaches in sequence modeling and transduction problems, such as language modeling and machine translation. However, the sequential nature of recurrent neural networks precludes parallelization within training examples, which becomes critical at longer sequence lengths, as memory constraints limit batching across examples.

We present the Transformer, a model architecture eschewing recurrence and instead relying entirely on an attention mechanism to draw global dependencies between input and output. The Transformer allows for significantly more parallelization and can reach a new state of the art in translation quality after being trained for as little as twelve hours on eight GPUs.
`;

function runTest(title: string, content: string, type: string) {
  console.log(`\n==================================================`);
  console.log(`Testing [${type}]`);
  console.log(`Title: "${title}"`);
  console.log(`==================================================`);

  const results = extractCandidatePhrases(title, content);
  
  console.log(`Extracted Candidates (Count: ${results.length}):`);
  console.table(results.map(r => ({ phrase: r.phrase, source: r.source })));
}

try {
  runTest(markdownTitle, markdownContent, "Markdown Document");
  runTest(docxTitle, docxContent, "DOCX Document");
  runTest(paperTitle, paperContent, "Academic Paper");
} catch (err) {
  console.error("Error executing candidate extractor test:", err);
}
