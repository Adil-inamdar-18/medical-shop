require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const connectDb = require("./config/db");
const customerRoutes = require("./routes/customerRoutes");
const orderRoutes = require("./routes/orderRoutes");
const medicineRoutes = require("./routes/medicineRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// routes
app.use("/api/auth", authRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/medicines", medicineRoutes);

// health check (used by the Admin Panel -> Database card)
app.get("/api/health", (req, res) => {
  const states = ["disconnected", "connected", "connecting", "disconnecting"];

  res.status(200).json({
    success: true,
    server: "running",
    database: states[mongoose.connection.readyState] || "unknown",
  });
});

// unknown API route
app.use("/api", (req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// database
connectDb();

// server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
