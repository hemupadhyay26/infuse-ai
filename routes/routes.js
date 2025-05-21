import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { queryRag } from "../src/rag-model/query-rag.js";
import { RESPONSE_CODES } from "../src/utils/responce-code.js";
import { processUploadFileByUser } from "../src/rag-model/utils/helperFun.js";
import { verifyAdmin } from "../src/handler/middleware/auth-middleware.js";

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  dest: "uploads/", // Directory where files will be temporarily stored
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10MB
});

// POST /ask route
router.post("/ask", async (req, res) => {
  const { question } = req.body;
  const userId = req.query.userId || req.body.userId;
  if (!question || typeof question !== "string" || !question.trim() || !userId) {
    return res
      .status(RESPONSE_CODES.BAD_REQUEST)
      .json({ error: "Missing or invalid 'question' in request body." });
  }
  try {
    const response = await queryRag(question, userId);
    res.status(RESPONSE_CODES.SUCCESS).json(response);
  } catch (err) {
    res
      .status(RESPONSE_CODES.INTERNAL_SERVER_ERROR)
      .json({ error: err.message });
  }
});

router.post("/admin/login", (req, res) => {
  const { username, password } = req.body;

  if (
    username === ADMIN_CONFIG.username &&
    password === ADMIN_CONFIG.password
  ) {
    const token = jwt.sign(
      { userId: ADMIN_CONFIG.userId, isAdmin: true },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.status(RESPONSE_CODES.SUCCESS).json({
      message: "Admin logged in successfully",
      token,
    });
  }

  res.status(RESPONSE_CODES.UNAUTHORIZED).json({
    error: "Invalid admin credentials",
  });
});

// POST /upload route
router.post("/upload", upload.single("file"), async (req, res) => {
  const { userId } = req.body;
  const file = req.file;

  if (!userId || !file) {
    return res
      .status(RESPONSE_CODES.BAD_REQUEST)
      .json({ error: "Missing 'userId' or 'file' in request body." });
  }

  try {
    // Create a user-specific folder if it doesn't exist
    const userDir = path.join("uploads", userId);
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    // Move file to user directory
    const storedPath = path.join(userDir, file.originalname);
    fs.renameSync(file.path, storedPath);

    // OPTIONAL: return a job ID for tracking processing
    res.status(RESPONSE_CODES.SUCCESS).json({
      message: "File uploaded successfully.",
      filePath: storedPath,
    });

    // 👉 Start background processing
    processUploadFileByUser(userId, userDir);
    console.log(`File ${file.originalname} uploaded and moved to ${userDir}`);
  } catch (err) {
    console.error(err);
    res
      .status(RESPONSE_CODES.INTERNAL_SERVER_ERROR)
      .json({ error: err.message });
  }
});

// GET /health route
router.get("/health", (req, res) => {
  res.status(RESPONSE_CODES.SUCCESS).json({ status: "ok" });
});

export default router;