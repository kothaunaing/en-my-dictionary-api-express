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
const enmmDB = new Database("src/database/dictionary.db");
const mmDB = new Database("src/database/mm_mm.db");
const mmenDB = new Database("src/database/mm_en.db");

app.get("/", (req, res) => {
  res.send({ msg: "API is running well." });
});

app.get("/api/word/en-mm/:query", (req, res) => {
  try {
    const query = req.params.query;
    const stmt = enmmDB.prepare(
      "SELECT * FROM dictionary WHERE LOWER(word) = ?"
    );
    const stmt2 = mmenDB.prepare(
      "SELECT * from ml_dictionary_words WHERE LOWER(word) = ?"
    );

    const mmenWords = stmt2.all(query.toLocaleLowerCase());
    const enmmWords = stmt.all(query.toLocaleLowerCase());

    if (mmenWords.length > 0) {
      res.json({ type: "mm-en", results: mmenWords });
    } else if (enmmWords.length > 0) {
      res.json({ type: "en-mm", results: enmmWords });
    } else {
      res.status(404).json({ error: "Word not found" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/word/mm-mm/:query", (req, res) => {
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

app.get("/api/recommendations/en-mm/:query", (req, res) => {
  try {
    const query = req.params.query;
    let limit = parseInt(req.query.limit) || 10;
    limit = Math.min(limit, 40);

    // First, fetch the exact word if it exists
    const exactStmt = enmmDB.prepare(
      "SELECT _id, word FROM dictionary WHERE word = ? LIMIT 1"
    );
    const exactWord = exactStmt.get(query);

    // Then, fetch words that start with the query but exclude the exact match
    const recommendStmt = enmmDB.prepare(
      "SELECT _id, word FROM dictionary WHERE word LIKE ? AND word != ? LIMIT ?"
    );
    const recommendedWords = recommendStmt.all(query + "%", query, limit);

    // Combine results: exact word first, then recommendations
    const results = exactWord
      ? [exactWord, ...recommendedWords]
      : recommendedWords;

    // First, fetch the exact word if it exists
    const mmenExactStmt = mmenDB.prepare(
      "SELECT id, word FROM ml_dictionary_words WHERE word = ? LIMIT 1"
    );
    const mmenExactWord = mmenExactStmt.get(query);

    // Then, fetch words that start with the query but exclude the exact match
    const mmenRecommendStmt = mmenDB.prepare(
      "SELECT id, word FROM ml_dictionary_words WHERE word LIKE ? AND word != ? LIMIT ?"
    );
    const mmenRecommendedWords = mmenRecommendStmt.all(
      query + "%",
      query,
      limit
    );

    // Combine results: exact word first, then recommendations
    const mmenResults = mmenExactWord
      ? [mmenExactWord, ...mmenRecommendedWords]
      : mmenRecommendedWords;

    if (results.length > 0) {
      res.json({ type: "en-mm", results });
    } else if (mmenResults.length > 0) {
      res.json({ type: "mm-en", results: mmenResults });
    } else {
      res.status(404).json({ error: "No recommendations found" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/recommendations/mm-en/:query", (req, res) => {
  try {
    const query = req.params.query;
    let limit = parseInt(req.query.limit) || 10;
    limit = Math.min(limit, 40);

    // First, fetch the exact word if it exists
    const exactStmt = mmDB.prepare(
      "SELECT id, word, part_of_speech FROM dictionary_words WHERE word = ? LIMIT 1"
    );
    const exactWord = exactStmt.get(query);

    // Then, fetch words that start with the query but exclude the exact match
    const recommendStmt = mmDB.prepare(
      "SELECT id, word, part_of_speech FROM dictionary_words WHERE word LIKE ? AND word != ? LIMIT ?"
    );
    const recommendedWords = recommendStmt.all(query + "%", query, limit);

    // Combine results: exact word first, then recommendations
    const results = exactWord
      ? [exactWord, ...recommendedWords]
      : recommendedWords;

    if (results.length > 0) {
      res.json(results);
    } else {
      res.status(404).json({ error: "No recommendations found" });
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
