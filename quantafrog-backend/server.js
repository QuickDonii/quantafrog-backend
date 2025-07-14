const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./db');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = 3000;

// Get user data or create if not exists
app.get('/user/:id', (req, res) => {
  const userId = req.params.id;
  db.get("SELECT * FROM users WHERE id = ?", [userId], (err, row) => {
    if (err) return res.status(500).send("DB error");
    if (!row) {
      db.run("INSERT INTO users (id) VALUES (?)", [userId], () => {
        db.get("SELECT * FROM users WHERE id = ?", [userId], (err2, newUser) => {
          res.json(newUser);
        });
      });
    } else {
      res.json(row);
    }
  });
});

// Update user data and handle referral 5% rewards
app.post('/update', (req, res) => {
  const { id, coins, energy, tapPower } = req.body;

  db.get("SELECT * FROM users WHERE id = ?", [id], (err, user) => {
    if (err || !user) return res.status(500).send("User fetch failed");

    const diff = coins - user.coins;

    db.run("UPDATE users SET coins=?, energy=?, tapPower=? WHERE id=?",
      [coins, energy, tapPower, id], err2 => {
        if (err2) return res.status(500).send("Update failed");

        if (diff > 0 && user.referredBy) {
          const bonus = Math.floor(diff * 0.05);
          db.run("UPDATE users SET coins = coins + ? WHERE id = ?", [bonus, user.referredBy]);
        }

        res.send("Updated + referral handled");
      });
  });
});

// Handle referral linking and initial rewards
app.post('/referral', (req, res) => {
  const { newUserId, referredBy } = req.body;
  db.run("UPDATE users SET referredBy=? WHERE id=? AND referredBy IS NULL",
    [referredBy, newUserId], function (err) {
      if (err) return res.status(500).send("Referral failed");
      if (this.changes === 0) return res.send("Already referred");

      db.run("UPDATE users SET coins = coins + 10 WHERE id = ?", [newUserId]);
      db.run("UPDATE users SET coins = coins + 5 WHERE id = ?", [referredBy]);
      res.send("Referral successful");
    });
});

// Task claiming with prevention of double claims
app.post('/task', (req, res) => {
  const { id, taskId, amount } = req.body;

  db.get("SELECT * FROM tasks WHERE user_id = ? AND task_id = ?", [id, taskId], (err, row) => {
    if (row) return res.send("Already claimed");

    db.run("INSERT INTO tasks (user_id, task_id, claimed_at) VALUES (?, ?, datetime('now'))", [id, taskId]);
    db.run("UPDATE users SET coins = coins + ? WHERE id = ?", [amount, id]);
    res.send("Rewarded");
  });
});

app.listen(PORT, () => {
  console.log(`QUANTAFROG backend running on port ${PORT}`);
});
