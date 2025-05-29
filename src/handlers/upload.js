import fs from "fs";
import path from "path";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { s3 } from "../libs/s3Client.js";
import dynamoDBDocumentClient from "../libs/dynamodbClient.js";
import { processUploadFileByUser } from "../rag-model/utils/helperFun.js";

export async function uploadHandler(req, res) {
  const userId = req.user.userId;
  const file = req.file;

  if (!file) return res.status(400).json({ error: "No file provided" });

  const userDir = path.join("uploads", userId);
  if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });

  const storedPath = path.join(userDir, file.originalname);

  try {
    // Move the uploaded file to the user directory
    fs.renameSync(file.path, storedPath);

    // Process the file locally
    await processUploadFileByUser(userId, userDir);

    // Upload the processed file to S3
    const s3Key = `${userId}/${path.basename(storedPath)}`;
    const fileStream = fs.createReadStream(storedPath);

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: s3Key,
      Body: fileStream,
      ContentType: file.mimetype,
    });

    await s3.send(command);

    // Save file metadata to DynamoDB
    const s3Path = `s3://${process.env.AWS_S3_BUCKET}/${s3Key}`;
    const fileMetadata = {
      TableName: "UserFiles",
      Item: {
        userId,
        fileId: path.basename(storedPath), // Use file name as unique ID
        fileName: file.originalname,
        s3Path,
        uploadedAt: new Date().toISOString(),
      },
    };

    await dynamoDBDocumentClient.send(new PutCommand(fileMetadata));

    // Optionally clean up the local file after uploading
    fs.unlinkSync(storedPath);

    res.json({
      message: "File processed and uploaded to S3 successfully",
      filePath: s3Path,
    });
  } catch (err) {
    console.error("Error during file processing or upload:", err);
    res.status(500).json({ error: "File processing or upload failed" });
  }
}

// export async function uploadHandlerLocal(req, res) {
//   const userId = req.user.userId;
//   const file = req.file;

//   if (!file) return res.status(400).json({ error: "No file provided" });

//   const userDir = path.join("uploads", userId);
//   if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });

//   const storedPath = path.join(userDir, file.originalname);

//   try {
//     // Move the uploaded file to the user directory
//     fs.renameSync(file.path, storedPath);

//     // Process the file locally
//     console.log("Processing file locally...");
//     await processUploadFileByUser(userId, storedPath);

//     res.json({ message: "File processed successfully", filePath: storedPath });
//   } catch (err) {
//     console.error("Error during file processing:", err);
//     res.status(500).json({ error: "File processing failed" });
//   }
// }


