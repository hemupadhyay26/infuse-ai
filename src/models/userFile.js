// src/models/userFile.js
import { PutCommand, QueryCommand, GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import dynamoDBDocumentClient from '../libs/dynamodbClient.js';

const TABLE_NAME = 'UserFiles';

export async function saveUserFile(userId, fileId, fileName, s3Path, fileSize) {
  const timestamp = new Date().toISOString();
  
  const params = {
    TableName: TABLE_NAME,
    Item: {
      userId,
      fileId,
      fileName,
      s3Path,
      fileSize,
      uploadedAt: timestamp,
      status: 'processed'
    }
  };

  await dynamoDBDocumentClient.send(new PutCommand(params));
  return { userId, fileId, fileName, uploadedAt: timestamp };
}

export async function getUserFiles(userId) {
  const params = {
    TableName: TABLE_NAME,
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId
    }
  };

  const result = await dynamoDBDocumentClient.send(new QueryCommand(params));
  return result.Items || [];
}

export async function getUserFile(userId, fileId) {
  const params = {
    TableName: TABLE_NAME,
    Key: {
      userId,
      fileId
    }
  };

  const result = await dynamoDBDocumentClient.send(new GetCommand(params));
  return result.Item;
}

export async function deleteUserFile(userId, fileId) {
  const params = {
    TableName: TABLE_NAME,
    Key: {
      userId,
      fileId
    }
  };

  await dynamoDBDocumentClient.send(new DeleteCommand(params));
  return { userId, fileId, deleted: true };
}