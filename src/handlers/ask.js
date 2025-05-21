import { queryRag } from "../rag-model/query-rag.js";

export async function askHandler(req, res) {
  const userId = req.user.userId;
  const { question } = req.body;
  if (!question) return res.status(400).json({ error: "Missing question" });

  try {
    const result = await queryRag(question, userId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
