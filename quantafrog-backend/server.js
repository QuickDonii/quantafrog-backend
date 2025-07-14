const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// SQLite DB Setup
const db = new sqlite3.Database("./database.sqlite", (err) => {
  if (err) return console.error("DB init error:", err.message);
  console.log("✅ SQLite database connected");
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      coins INTEGER DEFAULT 0,
      energy INTEGER DEFAULT 10,
      tapPower INTEGER DEFAULT 1,
      referredBy TEXT
    )
  `);
});

// 🔄 Get or create user
function getUser(id) {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM users WHERE id = ?", [id], (err, row) => {
      if (err) return reject(err);
      if (row) return resolve(row);

      // Create new user
      const defaultUser = { id, coins: 0, energy: 10, tapPower: 1, referredBy: null };
      db.run(
        "INSERT INTO users (id, coins, energy, tapPower, referredBy) VALUES (?, ?, ?, ?, ?)",
        [id, 0, 10, 1, null],
        (err) => {
          if (err) return reject(err);
          resolve(defaultUser);
        }
      );
    });
  });
}

// 🔁 Update user data
function updateUser(user) {
  return new Promise((resolve, reject) => {
    db.run(
      "UPDATE users SET coins = ?, energy = ?, tapPower = ?, referredBy = ? WHERE id = ?",
      [user.coins, user.energy, user.tapPower, user.referredBy, user.id],
      (err) => {
        if (err) return reject(err);
        resolve();
      }
    );
  });
}

// 🚀 API Routes

// Get user
app.get("/user/:id", async (req, res) => {
  try {
    const user = await getUser(req.params.id);
    res.json(user);
  } catch (err) {
    console.error("GET /user error:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Update user
app.post("/user/:id", async (req, res) => {
  try {
    const user = { ...req.body, id: req.params.id };
    await updateUser(user);
    res.json({ success: true });
  } catch (err) {
    console.error("POST /user error:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Health check
app.get("/", (req, res) => {
  res.send("QUANTAFROG backend is running 🐸");
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 QUANTAFROG backend running on port ${PORT}`);
});
