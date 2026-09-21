const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

const sanitize = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
});

// Register (Signup)
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    const user = await User.create({
      name,
      email,
      password: User.hashPassword(password),
      role: role === "admin" ? "admin" : "user",
    });

    const token = signToken(user);

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: { token, user: sanitize(user) },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create account",
      error: error.message,
    });
  }
};

// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    }).select("+password");

    if (!user || !user.verifyPassword(password)) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = signToken(user);

    res.status(200).json({
      success: true,
      message: "Logged in successfully",
      data: { token, user: sanitize(user) },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to log in",
      error: error.message,
    });
  }
};

// Get Current User (session restore)
const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    data: sanitize(req.user),
  });
};

module.exports = { register, login, getMe };
