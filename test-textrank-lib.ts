import { TextRank } from "ts-textrank";

try {
  const text = "React is a JavaScript library for building user interfaces. React server components improve loading speed and performance.";
  // ts-textrank usage
  const tr = new TextRank(text);
  const keywords = tr.getKeyWords(5);
  console.log("SUCCESS: ts-textrank keywords:", keywords);
} catch (err) {
  console.error("FAIL to run ts-textrank:", err);
}
