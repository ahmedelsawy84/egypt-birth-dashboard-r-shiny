const express = require("express");
const router = express.Router();
const pool = require("../db");

// GET all jobs
router.get("/", async (req, res) => {
  try {
    const [jobs] = await pool.query("SELECT * FROM jobs ORDER BY id DESC");
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SEARCH jobs by title, company, or location
router.get("/search", async (req, res) => {
  try {
    const q = req.query.q || "";
    const like = `%${q}%`;

    const [jobs] = await pool.query(
      "SELECT * FROM jobs WHERE title LIKE ? OR company LIKE ? OR location LIKE ?",
      [like, like, like]
    );

    res.json(jobs);
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ADD a job
router.post("/", async (req, res) => {
  try {
    const { title, company, location, salary, description } = req.body;

    await pool.query(
      "INSERT INTO jobs (title, company, location, salary, description) VALUES (?, ?, ?, ?, ?)",
      [title, company, location, salary, description]
    );

    res.json({ message: "Job added successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a job
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query("DELETE FROM jobs WHERE id = ?", [id]);

    res.json({ message: "Job deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
