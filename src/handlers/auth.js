import jwt from "jsonwebtoken";
import { createUser, validateUser } from "../models/user.js";

export async function signupHandler(req, res) {
  try {
    const { username, password, email, name } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    try {
      const user = await createUser(username, password, email, name);
      res.json({ message: "Signup successful", userId: user.userId });
    } catch (error) {
      if (error.message === "Username already exists") {
        return res.status(400).json({ error: "User already exists" });
      }
      throw error;
    }
  } catch (err) {
    console.error("Error during signup:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function loginHandler(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const user = await validateUser(username, password);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Create JWT token
    const token = jwt.sign(
      { userId: user.userId, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token });
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}