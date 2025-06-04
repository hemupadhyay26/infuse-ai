import 'dotenv/config';
import express from "express";
import cors from "cors";
import multer from "multer";

import { signupHandler, loginHandler, logoutHandler, getUserHandler } from "./src/handlers/auth.js";
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
import { deleteFileHandler, listFilesHandler } from './src/handlers/list-files.js';
import cookieParser from 'cookie-parser';

testConnection();
const app = express();
app.use(cors({
  origin: "http://localhost:5173", // your frontend URL
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());


const upload = multer({ dest: "uploads/" });

// Health check
app.get("/", (req, res) => res.json({ status: "ok" }));

// Public routes
app.post("/api/signup", signupHandler);
app.post("/api/login", loginHandler);
app.get("/api/auth/user", verifyToken, getUserHandler);

// Authenticated routes
app.post("/api/upload", verifyToken, upload.single("file"), uploadHandler);
app.post("/api/ask", verifyToken, askHandler);
app.post("/api/ask/stream", verifyToken, askStreamHandler);

// Routes for files
app.get('/api/files', verifyToken, listFilesHandler);
app.get('/api/files/:fileId', verifyToken, listFilesHandler);
app.delete('/api/files/:fileId', verifyToken, deleteFileHandler);


// Chat history routes
app.get('/api/chat-history', verifyToken, getChatHistoryHandler);
app.get('/api/chat-history/:messageId', verifyToken, getChatMessageHandler);
app.delete('/api/chat-history/:messageId', verifyToken, deleteChatMessageHandler);
app.delete('/api/chat-history', verifyToken, deleteAllChatHistoryHandler);

app.post("/api/logout", verifyToken, logoutHandler);
const APP_PORT = process.env.APP_PORT || 3000;
app.listen(APP_PORT, () => console.log(`🚀 Server running on port ${APP_PORT}`));