const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.sqlite');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    coins INTEGER DEFAULT 0,
    energy INTEGER DEFAULT 10,
    tapPower INTEGER DEFAULT 1,
    referredBy TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS tasks (
    user_id TEXT,
    task_id TEXT,
    claimed_at TEXT,
    PRIMARY KEY (user_id, task_id)
  )`);
});

module.exports = db;
