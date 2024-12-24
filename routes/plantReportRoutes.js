const express = require("express");
const router = express.Router();
const {
  createPlantReport,
  getPlantReports,
  getPlantDateRecord,
  getPlantDetailsWithLastReport,
  updateSuperAdminComment,
} = require("../controllers/plantReportController");
const authMiddleware = require("../middleware/authMiddleware");

// Create a new plant report
router.post("/", authMiddleware, createPlantReport);

// Get reports by plant ID and optional date
// router.get("/:plant_id", authMiddleware, getPlantReports);

// Fetch plant reports
router.get("/plant-reports", authMiddleware, getPlantReports);

// Get reports by plant zone, number, and date
router.get("/records", authMiddleware, getPlantDateRecord);

// Get plant details with the last reported date
router.get(
  "/plants-with-last-report",
  authMiddleware,
  getPlantDetailsWithLastReport
);

// Add the PATCH route for updating the super admin comment
router.patch("/:id/comment", authMiddleware, updateSuperAdminComment);

module.exports = router;
