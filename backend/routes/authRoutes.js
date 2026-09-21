const express = require("express");

const { register, login, getMe } = require("../controllers/authController");
const { protect } = require("../middleware/auth");

const router = express.Router();

// Signup
router.post("/register", register);

// Login
router.post("/login", login);

// Current logged-in user (used to restore a session on page load)
router.get("/me", protect, getMe);

module.exports = router;
