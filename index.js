import express from "express";
import { queryRag } from "./src/query-rag.js";
import { RESPONSE_CODES } from "./src/utils/responce-code.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.post("/ask", async (req, res) => {
  const { question } = req.body;
  if (!question || typeof question !== "string" || !question.trim()) {
    return res.status(RESPONSE_CODES.BAD_REQUEST).json({ error: "Missing or invalid 'question' in request body." });
  }
  try {
    // Call queryRag and capture its return value
    const response = await queryRag(question);
    res.status(RESPONSE_CODES.SUCCESS).json(response);
  } catch (err) {
    res.status(RESPONSE_CODES.INTERNAL_SERVER_ERROR).json({ error: err.message });
  }
});

app.get("/health", (req, res) => {
  res.status(RESPONSE_CODES.SUCCESS).json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`infuse-ai RAG API server running on port ${PORT}`);
});
