import { QueryCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import dynamoDBDocumentClient from "../libs/dynamodbClient.js";

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