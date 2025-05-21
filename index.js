import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";

import { signupHandler, loginHandler } from "./src/handlers/auth.js";
import { verifyToken } from "./src/handlers/middleware/authMiddleware.js";
import { uploadHandler } from "./src/handlers/upload.js";
import { askHandler } from "./src/handlers/ask.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

// Public routes
app.post("/signup", signupHandler);
app.post("/login", loginHandler);

// Authenticated routes
app.post("/upload", verifyToken, upload.single("file"), uploadHandler);
app.post("/ask", verifyToken, askHandler);

// Health check
app.get("/health", (req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
