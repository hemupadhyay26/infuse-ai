import 'dotenv/config';
import express from "express";
import cors from "cors";
import multer from "multer";

import { signupHandler, loginHandler } from "./src/handlers/auth.js";
import { verifyToken } from "./src/handlers/middleware/authMiddleware.js";
import { uploadHandler } from "./src/handlers/upload.js";
import { askHandler, askStreamHandler } from "./src/handlers/ask.js";
import { 
  getChatHistoryHandler, 
  getChatMessageHandler, 
  deleteChatMessageHandler, 
  deleteAllChatHistoryHandler 
} from "./src/handlers/chat.js";
import { testConnection } from './src/libs/dynamodbClient.js';
import { listFilesHandler } from './src/handlers/list-files.js';

testConnection();
const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

// Health check
app.get("/", (req, res) => res.json({ status: "ok" }));

// Public routes
app.post("/api/signup", signupHandler);
app.post("/api/login", loginHandler);

// Authenticated routes
app.post("/api/upload", verifyToken, upload.single("file"), uploadHandler);
app.post("/api/ask", verifyToken, askHandler);
app.post("/api/ask/stream", verifyToken, askStreamHandler);

// Routes for files
app.get('/api/files', verifyToken, listFilesHandler);
app.get('/api/files/:fileId', verifyToken, listFilesHandler);

// Chat history routes
app.get('/api/chat-history', verifyToken, getChatHistoryHandler);
app.get('/api/chat-history/:messageId', verifyToken, getChatMessageHandler);
app.delete('/api/chat-history/:messageId', verifyToken, deleteChatMessageHandler);
app.delete('/api/chat-history', verifyToken, deleteAllChatHistoryHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));