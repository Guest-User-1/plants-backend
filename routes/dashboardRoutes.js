const express = require("express");
const {
  getAllUsers,
  searchUsers,
  updateUser,
  deleteUser,
} = require("../controllers/dashboardController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Get all users zone-wise
router.get("/users", authMiddleware, getAllUsers);

// Search users by name or phone number
router.get("/users/search", authMiddleware, searchUsers);

// Update a user
router.put("/users/:id", authMiddleware, updateUser);

// Delete a user
router.delete("/users/:id", authMiddleware, deleteUser);

module.exports = router;
