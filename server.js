// server.js
import express from "express";
import Database from "better-sqlite3"; // Ensure you're importing the correct module
import cors from "cors";
const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cors());

// Connect to your existing database
const enmmDB = new Database("database/dictionary.db", { verbose: console.log });
const mmDB = new Database("database/mm_mm.db", { verbose: console.log });

app.get("/", (req, res) => {
  res.send({ msg: "API is running well." });
});

app.get("/word/:query", (req, res) => {
  try {
    const query = req.params.query;
    const stmt = enmmDB.prepare("SELECT * FROM dictionary WHERE word = ?");
    const words = stmt.all(query);
    if (words.length > 0) {
      res.json(words);
    } else {
      res.status(404).json({ error: "Word not found" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/mm-word/:query", (req, res) => {
  try {
    const query = req.params.query;
    const stmt = mmDB.prepare("SELECT * FROM dictionary_words WHERE word = ?");
    const words = stmt.all(query);
    if (words.length > 0) {
      res.json(words);
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
