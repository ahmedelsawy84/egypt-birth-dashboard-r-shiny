const express = require("express");
const router = express.Router();
const pool = require("../db");
const multer = require("multer");
require("dotenv").config();

const storage = multer.diskStorage({
  destination: process.env.UPLOAD_DIR,
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// Apply to job
router.post("/", upload.single("resume"), async (req, res) => {
  try {
    const { job_id, name, email } = req.body;

    await pool.query(
      "INSERT INTO applications (job_id, name, email, resume_path) VALUES (?, ?, ?, ?)",
      [job_id, name, email, req.file.filename]
    );

    res.json({ message: "Application submitted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
