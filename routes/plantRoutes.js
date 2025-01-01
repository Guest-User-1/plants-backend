const express = require("express");
const multer = require("multer");
const {
  registerPlant,
  updatePlant,
  getPlantDetails,
  deletePlantByZone,
  deletePlant,
  getPlantsByZone,
  getAllPlants,
} = require("../controllers/plantController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Configure multer to store files in memory
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Routes
router.post(
  "/register-plant",
  authMiddleware,
  upload.single("plant_image"),
  registerPlant
);
router.get("/get-map-plant", authMiddleware, getAllPlants);
router.get("/get-plant", authMiddleware, getPlantDetails);
router.get("/zonewise", authMiddleware, getPlantsByZone);
router.put(
  "/update-plant",
  authMiddleware,
  upload.single("plant_image"),
  updatePlant
);
router.delete("/delete-zone-plant", authMiddleware, deletePlantByZone);
router.delete("/delete-plant", authMiddleware, deletePlant);

module.exports = router;
