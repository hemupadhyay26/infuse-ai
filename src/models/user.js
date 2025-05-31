// src/models/user.js
import { GetCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import dynamoDBDocumentClient from '../libs/dynamodbClient.js';

const TABLE_NAME = 'Users';

export async function createUser(username, password, email, name) {
  // Check if user already exists
  const existingUser = await getUserByUsername(username);
  if (existingUser) {
    throw new Error('Username already exists');
  }

  // Generate a unique userId using UUID
  const userId = uuidv4();

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  const params = {
    TableName: TABLE_NAME,
    Item: {
      username,
      passwordHash: hashedPassword,
      email,
      name,
      createdAt: new Date().toISOString(),
      userId
    }
  };

  await dynamoDBDocumentClient.send(new PutCommand(params));
  return { username, email, name, userId };
}

export async function getUserByUsername(username) {
  const params = {
    TableName: TABLE_NAME,
    Key: {
      username
    }
  };

  const result = await dynamoDBDocumentClient.send(new GetCommand(params));
  return result.Item;
}

export async function getUserById(userId) {
  const params = {
    TableName: TABLE_NAME,
    IndexName: 'UserIdIndex', // You'll need to create this GSI in your DynamoDB table
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId
    }
  };

  const result = await dynamoDBDocumentClient.send(new QueryCommand(params));
  return result.Items?.[0] || null;
}

export async function validateUser(username, password) {
  const user = await getUserByUsername(username);
  
  if (!user) {
    return null;
  }

  // Check if we have a password hash (could be passwordHash from existing data)
  const storedHash = user.passwordHash || user.password;
  
  if (!storedHash) {
    console.error('No password hash found for user:', username);
    return null;
  }

  const isValid = await bcrypt.compare(password, storedHash);
  if (!isValid) {
    return null;
  }

  // Return user without password/passwordHash
  const { password: _, passwordHash: __, ...userWithoutPassword } = user;
  return userWithoutPassword;
}