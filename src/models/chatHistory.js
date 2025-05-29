// src/models/chatHistory.js
import { v4 as uuidv4 } from 'uuid';
import { PutCommand, QueryCommand, DeleteCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import dynamoDBDocumentClient from '../libs/dynamodbClient.js';
import { excludeFields } from '../libs/excludeFields.js';

const TABLE_NAME = 'ChatHistory';

export async function saveChatMessage(userId, question, answer, sources = []) {
  const timestamp = new Date().toISOString();
  const messageId = `${timestamp}-${uuidv4()}`;
  
  const params = {
    TableName: TABLE_NAME,
    Item: {
      userId,
      messageId,
      question,
      answer,
      sources,
      timestamp
    }
  };

  await dynamoDBDocumentClient.send(new PutCommand(params));
  return messageId;
}

export async function getUserChatHistory(userId, limit = 20) {
  const params = {
    TableName: TABLE_NAME,
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId
    },
    ScanIndexForward: false, // Sort in descending order (newest first)
    Limit: limit
  };

  const result = await dynamoDBDocumentClient.send(new QueryCommand(params));
  return excludeFields(result.Items || [], ['userId']);
}

export async function getChatMessage(userId, messageId) {
  const params = {
    TableName: TABLE_NAME,
    Key: {
      userId,
      messageId
    }
  };

  const result = await dynamoDBDocumentClient.send(new GetCommand(params));
  return excludeFields(result.Item, ['userId']);
}

export async function deleteChatMessage(userId, messageId) {
  const params = {
    TableName: TABLE_NAME,
    Key: {
      userId,
      messageId
    }
  };

  await dynamoDBDocumentClient.send(new DeleteCommand(params));
  return { userId, messageId, deleted: true };
}

export async function deleteAllUserChatHistory(userId) {
  // First get all chat messages for the user
  const chatHistory = await getUserChatHistory(userId, 1000); // Set a high limit to get most/all messages
  
  // Delete each message one by one
  const deletePromises = chatHistory.map(chat => 
    deleteChatMessage(userId, chat.messageId)
  );
  
  await Promise.all(deletePromises);
  return { userId, deletedCount: chatHistory.length };
}