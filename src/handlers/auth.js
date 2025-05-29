import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import dynamoDBDocumentClient from "../libs/dynamodbClient.js";

export async function signupHandler(req, res) {
  try {
    const { username, password } = req.body;

    // Check if user exists
    const getUserParams = {
      TableName: "Users",
      Key: { username },
    };

    const existingUser = await dynamoDBDocumentClient.send(new GetCommand(getUserParams));
    if (existingUser.Item) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Create new user with generated userId
    const userId = crypto.randomUUID();
    const putUserParams = {
      TableName: "Users",
      Item: {
        username,
        passwordHash: hashed,
        userId,
        createdAt: new Date().toISOString(),
      },
    };

    await dynamoDBDocumentClient.send(new PutCommand(putUserParams));

    res.json({ message: "Signup successful" });
  } catch (err) {
    console.error("Error during signup:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function loginHandler(req, res) {
  try {
    const { username, password } = req.body;

    // Find user by username
    const getUserParams = {
      TableName: "Users",
      Key: { username },
    };

    const user = await dynamoDBDocumentClient.send(new GetCommand(getUserParams));
    if (!user.Item) {
      return res.status(401).json({ error: "Invalid user" });
    }

    // Compare password hash
    const match = await bcrypt.compare(password, user.Item.passwordHash);
    if (!match) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: user.Item.userId, username },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token });
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}