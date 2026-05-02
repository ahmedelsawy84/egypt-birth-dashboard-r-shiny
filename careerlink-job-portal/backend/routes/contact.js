const express = require("express");
const router = express.Router();
const pool = require("../db");

// POST contact message
router.post("/", async (req, res) => {
  try {
    const { email, message } = req.body;

    if (!email || !message) {
      return res.status(400).json({ error: "All fields are required" });
    }

    await pool.query(
      "INSERT INTO contact_messages (email, message) VALUES (?, ?)",
      [email, message]
    );

    res.status(201).json({ message: "Message saved successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
