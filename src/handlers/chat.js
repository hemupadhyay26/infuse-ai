// src/handlers/chat.js
import { 
  getUserChatHistory, 
  getChatMessage, 
  deleteChatMessage, 
  deleteAllUserChatHistory 
} from "../models/chatHistory.js";

export async function getChatHistoryHandler(req, res) {
  const userId = req.user.userId;
  const limit = req.query.limit ? parseInt(req.query.limit) : 20;
  
  try {
    const history = await getUserChatHistory(userId, limit);
    res.json({ history });
  } catch (err) {
    console.error("Error fetching chat history:", err);
    res.status(500).json({ error: "Failed to fetch chat history" });
  }
}

export async function getChatMessageHandler(req, res) {
  const userId = req.user.userId;
  const { messageId } = req.params;
  
  if (!messageId) {
    return res.status(400).json({ error: "Message ID is required" });
  }
  
  try {
    const message = await getChatMessage(userId, messageId);
    
    if (!message) {
      return res.status(404).json({ error: "Chat message not found" });
    }
    
    res.json({ message });
  } catch (err) {
    console.error("Error fetching chat message:", err);
    res.status(500).json({ error: "Failed to fetch chat message" });
  }
}

export async function deleteChatMessageHandler(req, res) {
  const userId = req.user.userId;
  const { messageId } = req.params;
  
  if (!messageId) {
    return res.status(400).json({ error: "Message ID is required" });
  }
  
  try {
    // Check if message exists and belongs to user
    const message = await getChatMessage(userId, messageId);
    
    if (!message) {
      return res.status(404).json({ error: "Chat message not found" });
    }
    
    await deleteChatMessage(userId, messageId);
    res.json({ success: true, messageId });
  } catch (err) {
    console.error("Error deleting chat message:", err);
    res.status(500).json({ error: "Failed to delete chat message" });
  }
}

export async function deleteAllChatHistoryHandler(req, res) {
  const userId = req.user.userId;
  
  try {
    const result = await deleteAllUserChatHistory(userId);
    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (err) {
    console.error("Error deleting chat history:", err);
    res.status(500).json({ error: "Failed to delete chat history" });
  }
}