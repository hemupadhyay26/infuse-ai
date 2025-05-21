import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";

const USERS_FILE = path.join("src", "db", "users.json");

export async function signupHandler(req, res) {
  const { username, password } = req.body;
  const users = JSON.parse(fs.readFileSync(USERS_FILE));
  if (users[username]) return res.status(400).json({ error: "User exists" });

  const hashed = await bcrypt.hash(password, 10);
  users[username] = { password: hashed, userId: crypto.randomUUID() };
  fs.writeFileSync(USERS_FILE, JSON.stringify(users));

  res.json({ message: "Signup successful" });
}

export async function loginHandler(req, res) {
  const { username, password } = req.body;
  const users = JSON.parse(fs.readFileSync(USERS_FILE));
  const user = users[username];
  if (!user) return res.status(401).json({ error: "Invalid user" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign({ userId: user.userId, username }, process.env.JWT_SECRET);
  res.json({ token });
}
