import { queryRag } from "../rag-model/query-rag.js";
import { saveChatMessage } from "../models/chatHistory.js";

export async function askHandler(req, res) {
  const userId = req.user.userId;
  const { question } = req.body;
  if (!question) return res.status(400).json({ error: "Missing question" });

  try {
    // Add a timestamp for tracking response time
    const startTime = Date.now();
    
    const result = await queryRag(question, userId);
    
    // Calculate response time
    const responseTime = Date.now() - startTime;
    
    // Save the chat message to DynamoDB
    const messageId = await saveChatMessage(userId, question, result.answer, result.sources);
    
    res.json({
      ...result,
      messageId,
      responseTime: `${responseTime / 1000} seconds`
    });
  } catch (err) {
    console.error("Error in askHandler:", err);
    res.status(500).json({ error: err.message });
  }
}

export async function askStreamHandler(req, res) {
  const userId = req.user.userId;
  const { question } = req.body;
  if (!question) return res.status(400).json({ error: "Missing question" });

  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Prevents Nginx from buffering the response

  try {
    let fullAnswer = "";
    const startTime = Date.now();
    
    // Send initial message to confirm connection
    res.write(`data: ${JSON.stringify({ status: "connected" })}\n\n`);
    
    // Define the token callback
    const onToken = (token) => {
      res.write(`data: ${JSON.stringify({ token })}\n\n`);
    };

    // Stream the response
    const result = await queryRag(question, userId, onToken, true);
    fullAnswer = result.answer;
    
    // Calculate response time
    const responseTime = Date.now() - startTime;
    
    // Save the complete message to DynamoDB after streaming is done
    const messageId = await saveChatMessage(userId, question, fullAnswer, result.sources);
    
    // Send the end event with sources and timing information
    res.write(`data: ${JSON.stringify({ 
      done: true, 
      messageId,
      sources: result.sources,
      responseTime: `${responseTime / 1000} seconds`
    })}\n\n`);
    res.end();
  } catch (err) {
    console.error("Error during streaming:", err);
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
}