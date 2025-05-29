// src/models/user.js
import { GetCommand, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import bcrypt from 'bcrypt';
import dynamoDBDocumentClient from '../libs/dynamodbClient.js';

const TABLE_NAME = 'Users';

export async function createUser(username, password, email, name) {
  // Check if user already exists
  const existingUser = await getUserByUsername(username);
  if (existingUser) {
    throw new Error('Username already exists');
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  const params = {
    TableName: TABLE_NAME,
    Item: {
      username,
      passwordHash: hashedPassword, // Changed to passwordHash to match existing schema
      email,
      name,
      createdAt: new Date().toISOString(),
      userId: username // Using username as userId for simplicity
    }
  };

  await dynamoDBDocumentClient.send(new PutCommand(params));
  return { username, email, name, userId: username };
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