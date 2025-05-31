import { QueryCommand, GetCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import dynamoDBDocumentClient from "../libs/dynamodbClient.js";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "../libs/s3Client.js";

export async function listFilesHandler(req, res) {
  const userId = req.user.userId;
  // Check for fileId in both params and query to support different routing patterns
  const fileId = req.params.fileId || req.query.fileId;
  
  try {
    // If fileId is provided, get a specific file
    if (fileId) {
      const params = {
        TableName: "UserFiles",
        Key: {
          userId,
          fileId
        }
      };
      
      const { Item } = await dynamoDBDocumentClient.send(new GetCommand(params));
      
      if (!Item) {
        return res.status(404).json({ error: "File not found" });
      }
      
      return res.json({
        file: {
          fileId: Item.fileId,
          fileName: Item.fileName,
          fileSize: Item.fileSize,
          contentType: Item.contentType,
          uploadedAt: Item.uploadedAt,
        }
      });
    }
    
    // Otherwise, list all files for the user
    const params = {
      TableName: "UserFiles",
      KeyConditionExpression: "userId = :userId",
      ExpressionAttributeValues: {
        ":userId": userId
      }
    };
    
    const { Items } = await dynamoDBDocumentClient.send(new QueryCommand(params));
    
    if (!Items || Items.length === 0) {
      return res.json({ files: [] });
    }
    
    // Format the response with file information and generate download URLs
    const files = Items.map(file => {
      
      return {
        fileId: file.fileId,
        fileName: file.fileName,
        fileSize: file.fileSize,
        contentType: file.contentType,
        uploadedAt: file.uploadedAt,
      };
    });
    
    res.json({ files });
  } catch (error) {
    console.error("Error listing files:", error);
    res.status(500).json({ error: "Failed to list files" });
  }
}

export async function deleteFileHandler(req, res) {
  const userId = req.user.userId;
  const fileId = req.params.fileId;

  if (!fileId) {
    return res.status(400).json({ error: "File ID is required" });
  }

  try {
    // Get file metadata to determine S3 key
    const getParams = {
      TableName: "UserFiles",
      Key: {
        userId,
        fileId
      }
    };
    const { Item } = await dynamoDBDocumentClient.send(new GetCommand(getParams));
    if (!Item) {
      return res.status(404).json({ error: "File not found" });
    }

    // Delete from S3
    const s3Key = `${userId}/${fileId}`;
    await s3.send(new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: s3Key
    }));

    // Delete from DynamoDB
    await dynamoDBDocumentClient.send(new DeleteCommand(getParams));

    res.json({ message: "File deleted successfully", fileId });
  } catch (error) {
    console.error("Error deleting file:", error);
    res.status(500).json({ error: "Failed to delete file" });
  }
}