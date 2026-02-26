const express = require("express");
const cors = require("cors");
const path = require("path");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

/* ===== DATABASE CONNECTION ===== */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

/* ===== CREATE TABLE IF NOT EXISTS ===== */
async function initDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS app_state (
        id INTEGER PRIMARY KEY,
        data JSONB
      );
    `);
    console.log("Database ready");
  } catch (err) {
    console.error("Database init error:", err);
  }
}

initDatabase();

/* ===== GET STATE ===== */
app.get("/api/state", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT data FROM app_state WHERE id = 1"
    );

    if (result.rows.length === 0) {
      return res.json(null);
    }

    res.json(result.rows[0].data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ===== SAVE STATE ===== */
app.post("/api/state", async (req, res) => {
  try {
    await pool.query(
      `
      INSERT INTO app_state (id, data)
      VALUES (1, $1)
      ON CONFLICT (id)
      DO UPDATE SET data = EXCLUDED.data
      `,
      [req.body]
    );

    res.json({ message: "State saved successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ===== SERVE FRONTEND ===== */
app.use(express.static(path.join(__dirname, "../dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../dist", "index.html"));
});

/* ===== START SERVER ===== */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});