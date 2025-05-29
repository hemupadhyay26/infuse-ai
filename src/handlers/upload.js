import fs from "fs";
import path from "path";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "../libs/s3Client.js";
import { processUploadFileByUser } from "../rag-model/utils/helperFun.js";
import { saveUserFile } from "../models/userFile.js";

export async function uploadHandler(req, res) {
  const userId = req.user.userId;
  const file = req.file;

  if (!file) return res.status(400).json({ error: "No file provided" });

  const userDir = path.join("uploads", userId);
  
  try {
    // Create user directory if it doesn't exist
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    const storedPath = path.join(userDir, file.originalname);

    // Use fs.copyFile instead of rename to avoid permission issues
    fs.copyFileSync(file.path, storedPath);
    // Delete the temp file after copying
    fs.unlinkSync(file.path);

    // Process the file locally
    await processUploadFileByUser(userId, userDir);

    // Upload the processed file to S3
    const fileId = path.basename(storedPath);
    const s3Key = `${userId}/${fileId}`;
    const fileStream = fs.createReadStream(storedPath);

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: s3Key,
      Body: fileStream,
      ContentType: file.mimetype,
    });

    await s3.send(command);

    // Save file metadata to DynamoDB using the model
    const s3Path = `s3://${process.env.AWS_S3_BUCKET_NAME}/${s3Key}`;
    await saveUserFile(userId, fileId, file.originalname, s3Path);

    // Optionally clean up the local file after uploading
    fs.unlinkSync(storedPath);

    res.json({
      message: "File processed and uploaded to S3 successfully",
      filePath: s3Path,
      fileId
    });
  } catch (err) {
    console.error("Error during file processing or upload:", err);
    res.status(500).json({ error: "File processing or upload failed" });
  }
}