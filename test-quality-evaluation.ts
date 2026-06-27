import { extractTagsFromText } from "./src/lib/tag-service";
import { generateSemanticAutoTags } from "./src/lib/tag-service";

interface EvalDoc {
  id: number;
  title: string;
  type: "Academic Paper" | "Technical Blog" | "Markdown Note";
  content: string;
}

const EVALUATION_DOCUMENTS: EvalDoc[] = [
  {
    id: 1,
    title: "Attention Is All You Need",
    type: "Academic Paper",
    content: `
    The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely. Recurrent models, such as long short-term memory (LSTM) and gated recurrent (GRU) neural networks, have been firmly established as state-of-the-art approaches in sequence modeling.
    `
  },
  {
    id: 2,
    title: "GPT-4 Technical Report Summary",
    type: "Academic Paper",
    content: `
    We report the development of GPT-4, a large-scale, multimodal model which can accept image and text inputs and produce text outputs. While less capable than humans in many real-world scenarios, GPT-4 exhibits human-level performance on various professional and academic benchmarks, including passing a simulated bar exam with a score around the top 10% of test takers. GPT-4 is a Transformer-based model pre-trained to predict the next token in a document. The post-training alignment process results in improved performance on measures of truthfulness and adherence to desired behavior.
    `
  },
  {
    id: 3,
    title: "Deep Residual Learning for Image Recognition (ResNet)",
    type: "Academic Paper",
    content: `
    Deeper neural networks are more difficult to train. We present a residual learning framework to ease the training of networks that are substantially deeper than those previously used. We explicitly reformulate the layers as learning residual functions with reference to the layer inputs, instead of learning unreferenced functions. We provide comprehensive empirical evidence showing that these residual networks are easier to optimize, and can gain accuracy from considerably increased depth. On the ImageNet dataset we evaluate residual nets with depth up to 152 layers—8x deeper than VGG nets but still having lower complexity. An ensemble of these residual nets achieves 3.57% error on the ImageNet test set.
    `
  },
  {
    id: 4,
    title: "React Server Components Architecture",
    type: "Technical Blog",
    content: `
    React Server Components (RSC) represent a paradigm shift in building modern web applications. By allowing components to render on the server, RSC significantly reduces the JavaScript bundle size sent to the browser, improving initial page load times and performance. Unlike traditional SSR (Server-Side Rendering), Server Components preserve client-side state and interactivity. They allow developers to write components that fetch data directly from databases or microservices, bridging the gap between frontend UI development and backend infrastructure.
    `
  },
  {
    id: 5,
    title: "Demystifying RAG and Vector Databases",
    type: "Technical Blog",
    content: `
    Retrieval-Augmented Generation (RAG) is a technique that enhances Large Language Models (LLMs) by fetching relevant data from external knowledge bases before generating a response. At the heart of RAG is the vector database, which stores text embeddings representing semantic meaning. When a user asks a query, it is converted into a vector, and the database performs a similarity search (like cosine similarity) to retrieve the most contextually relevant documents. These documents are then appended to the prompt, enabling the LLM to answer with factual, up-to-date information without fine-tuning.
    `
  },
  {
    id: 6,
    title: "Microservices vs Monolith: Architectural Trade-offs",
    type: "Technical Blog",
    content: `
    Choosing between microservices and a monolithic architecture is a critical decision in software engineering. A monolith stores all business logic, database queries, and routing in a single deployable codebase, which simplifies initial deployment and local testing. However, as the engineering team grows, the codebase becomes complex and hard to scale. Microservices break the application into independent, loosely coupled services communicating via REST APIs or message brokers like RabbitMQ. While microservices offer scaling flexibility and fault isolation, they introduce network latency, complex distributed transaction handling, and high DevOps maintenance overhead.
    `
  },
  {
    id: 7,
    title: "Kubernetes Orchestration: Pods, Services, and Deployments",
    type: "Technical Blog",
    content: `
    Kubernetes has become the de facto standard for container orchestration. In Kubernetes, the smallest deployable unit is a Pod, which represents a single instance of a running process and can contain one or more containers. Services provide a stable network endpoint to route traffic to these pods dynamically, handling load balancing. Deployments manage the lifecycle of pods, allowing developers to perform rolling updates, scale replicas up or down, and rollback to previous versions in case of application failures.
    `
  },
  {
    id: 8,
    title: "Rust Ownership and Memory Safety Notes",
    type: "Markdown Note",
    content: `
    # Rust Study Notes: Ownership Model

    Rust enforces memory safety without a garbage collector through three core rules of **ownership**:
    1. Each value in Rust has an owner.
    2. There can only be one owner at a time.
    3. When the owner goes out of scope, the value is dropped.

    ## Borrowing and References
    We can pass references using the \`&\` operator.
    - **Immutable references** (\`&T\`): You can have multiple active immutable references.
    - **Mutable references** (\`&mut T\`): You can only have one active mutable reference in a scope to prevent data races.
    *Rule:* You cannot borrow a value as mutable if immutable references are already active in the same scope.
    `
  },
  {
    id: 9,
    title: "Advanced Git Workflows: Rebase vs Merge",
    type: "Markdown Note",
    content: `
    # Git Workflow Notes

    Choosing between \`git rebase\` and \`git merge\` depends on your team's branching strategy.
    
    ## Git Merge
    - Integrates features back into the main branch by creating a *merge commit*.
    - Preserves the historical timeline of branches, showing exactly when feature integration occurred.
    - Can lead to a messy commit graph if feature branches are short-lived.

    ## Git Rebase
    - Rewrites commit history by moving the base of your branch to the tip of target branch.
    - Results in a clean, linear git history.
    - **Rule:** Never rebase commits that have been pushed to a public repository (it disrupts other developers' workspaces).
    `
  },
  {
    id: 10,
    title: "GraphQL vs REST API Architecture",
    type: "Markdown Note",
    content: `
    # API Design: GraphQL vs REST

    * REST (Representational State Transfer) is resource-centric. It uses standard HTTP verbs (GET, POST, PUT, DELETE) and multiple endpoints (e.g., \`/users\`, \`/posts\`). REST often suffers from *over-fetching* (getting more data than needed) or *under-fetching* (needing to call multiple endpoints).
    * GraphQL is client-centric. It exposes a single endpoint (usually \`/graphql\`) and allows clients to query exactly the fields they need using a schema definition. It prevents over-fetching and allows nesting relationships, but adds complexity in caching, rate limiting, and query performance optimization on the backend.
    `
  }
];

async function runEvaluation() {
  console.log("==================================================");
  console.log("Algorithm Quality Evaluation (10 Documents)");
  console.log("==================================================");

  const results: any[] = [];

  for (const doc of EVALUATION_DOCUMENTS) {
    // Temporarily suppress legacy tagger's verbose logs
    const originalLog = console.log;
    console.log = () => {};
    
    let legacyTags: string[] = [];
    try {
      legacyTags = extractTagsFromText(doc.title, "", "", doc.content);
    } catch (e) {
      // ignore
    } finally {
      console.log = originalLog;
    }

    // Run Semantic Auto Tags
    const semanticTags = await generateSemanticAutoTags(doc.title, doc.content);

    results.push({
      id: doc.id,
      title: doc.title,
      type: doc.type,
      legacy: legacyTags,
      semantic: semanticTags
    });
  }

  // Print highly structured clear output
  results.forEach(res => {
    console.log(`\n--------------------------------------------------`);
    console.log(`Doc #${res.id} [${res.type}] - Title: "${res.title}"`);
    console.log(`--------------------------------------------------`);
    console.log(`  [Legacy]:   ${JSON.stringify(res.legacy)}`);
    console.log(`  [Semantic]: ${JSON.stringify(res.semantic)}`);
  });

  console.log("\n==================================================");
  console.log("Evaluation Finished");
  console.log("==================================================");
}

runEvaluation().catch(err => {
  console.error("Evaluation run failed:", err);
});
