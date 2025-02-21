// server.js
import express from "express";
import Database from "better-sqlite3"; // Ensure you're importing the correct module

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Connect to your existing database
const db = new Database("dictionary.db", { verbose: console.log });

app.get("/", (req, res) => {
  res.send({ msg: "API is running well." });
});

// GET: Retrieve a Specific Word by ID
app.get("/word/:query", (req, res) => {
  try {
    const query = req.params.query;
    const stmt = db.prepare("SELECT * FROM dictionary WHERE word = ?");
    const word = stmt.get(query);
    if (word) {
      res.json(word);
    } else {
      res.status(404).json({ error: "Word not found" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Dictionary API server is running on http://localhost:${port}`);
});
