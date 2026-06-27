import { Yake } from "yake-wasm";

try {
  const instance = new Yake();
  console.log("SUCCESS: yake-wasm loaded and instantiated successfully!");
  const text = "Google is acquiring data science community Kaggle. Machine learning and data science are great.";
  const results = instance.get_n_best(text);
  console.log("Yake results:", results);
} catch (err) {
  console.error("FAIL to run yake-wasm:", err);
}
