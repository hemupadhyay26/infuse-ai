import fs from "fs";
import path from "path";
import { processUploadFileByUser } from "../rag-model/utils/helperFun.js";

export async function uploadHandler(req, res) {
  const userId = req.user.userId;
  const file = req.file;

  if (!file) return res.status(400).json({ error: "No file" });

  const userDir = path.join("uploads", userId);
  if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });

  const storedPath = path.join(userDir, file.originalname);
  fs.renameSync(file.path, storedPath);

  // Trigger background file processing
  processUploadFileByUser(userId, userDir);

  res.json({ message: "Uploaded successfully", filePath: storedPath });
}
