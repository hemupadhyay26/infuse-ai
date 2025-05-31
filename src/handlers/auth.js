import jwt from "jsonwebtoken";
import { createUser, validateUser } from "../models/user.js";

export async function signupHandler(req, res) {
  try {
    const { username, password, email, name } = req.body;

    if (!username || !password || !email) {
      return res.status(400).json({ error: "Username, password, and email are required" });
    }

    try {
      const user = await createUser(username, password, email, name);
      res.json({ message: "Signup successful"});
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

export function getUserHandler(req, res) {
  // req.user was set by verifyToken middleware
  if (!req.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { userId, username } = req.user;
  res.status(200).json({ user: { userId, username } });
}


// export async function loginHandler(req, res) {
//   try {
//     const { username, password } = req.body;

//     if (!username || !password) {
//       return res.status(400).json({ error: "Username and password are required" });
//     }

//     const user = await validateUser(username, password);
//     if (!user) {
//       return res.status(401).json({ error: "Invalid credentials" });
//     }

//     // Create JWT token
//     const token = jwt.sign(
//       { userId: user.userId, username: user.username },
//       process.env.JWT_SECRET,
//       { expiresIn: "1h" }
//     );

//     res.json({ token });
//   } catch (err) {
//     console.error("Error during login:", err);
//     res.status(500).json({ error: "Internal server error" });
//   }
// }

// use cookies to store the JWT token
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

    // Set the token in an HttpOnly cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      sameSite: "Strict", // or 'Lax' depending on your frontend/backend setup
      maxAge: 60 * 60 * 1000, // 1 hour
    });

    // Optionally return user info (without token)
    res.status(200).json({ user: { username: user.username } });
  } catch (err) {
    console.error("Error during login:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

export function logoutHandler(req, res) {
  // Clear the token cookie by setting an empty value and immediate expiry
  res.cookie("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict", // or 'Lax' based on your needs
    expires: new Date(0),
  });

  res.status(200).json({ message: "Logged out successfully" });
}
