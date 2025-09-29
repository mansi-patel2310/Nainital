// server.js — Backend for Nainital Tourism Web App
import express from "express";
import fs from "fs/promises";
import path from "path";
import bcrypt from "bcrypt";

const app = express();
app.use(express.json());

const DATA_DIR = path.join(process.cwd(), "data");

// ---------------------------
// Helpers for file operations
// ---------------------------
async function read(file, def) {
  try {
    const txt = await fs.readFile(file, "utf8");
    return JSON.parse(txt);
  } catch {
    return def;
  }
}
async function write(file, data) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2), "utf8");
}

// ---------------------------
// Feedback API
// ---------------------------
app.post("/api/feedback", async (req, res) => {
  try {
    const file = path.join(DATA_DIR, "feedback.json");
    const old = await read(file, []);
    old.push({ ...req.body, timestamp: Date.now() });
    await write(file, old);
    res.json({ success: true, count: old.length });
  } catch (err) {
    console.error("feedback error", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---------------------------
// Auth APIs
// ---------------------------
app.post("/api/auth/signup", async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ error: "email+password required" });

  const file = path.join(DATA_DIR, "users.json");
  const users = await read(file, []);
  if (users.find((u) => u.email === email)) {
    return res.status(409).json({ error: "User already exists" });
  }

  const hash = await bcrypt.hash(password, 10);
  const user = { id: Date.now(), name, email, passwordHash: hash };
  users.push(user);
  await write(file, users);

  res.status(201).json({ success: true, user: { id: user.id, name, email } });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const file = path.join(DATA_DIR, "users.json");
  const users = await read(file, []);
  const user = users.find((u) => u.email === email);
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  res.json({ success: true, user: { id: user.id, name: user.name, email: user.email } });
});

// ---------------------------
// Bhoomi Chatbot API
// ---------------------------
app.post("/api/chat", (req, res) => {
  const { message } = req.body;
  // Simple demo reply — replace with AI API later if needed
  res.json({ reply: `Bhoomi: I received "${message}". How can I help you further?` });
});

// ---------------------------
// Start server
// ---------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("✅ Backend running on port " + PORT));
