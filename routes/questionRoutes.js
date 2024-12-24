const express = require("express");
const router = express.Router();
const { submitForm } = require("../controllers/questionController");
const authMiddleware = require("../middleware/authMiddleware");

// Submit the form
router.post("/submit", authMiddleware, submitForm);

module.exports = router;
