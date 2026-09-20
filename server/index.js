require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDb = require("./config/db");
const customerRoutes = require("./routes/customerRoutes");
const orderRoutes = require("./routes/orderRoutes");
const medicineRoutes = require("./routes/medicineRoutes");

const app = express();
const port = process.env.PORT;

// middleware
app.use(cors());
app.use(express.json());

// routes
app.use("/api/customers", customerRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/medicines", medicineRoutes);

// database
connectDb();

// server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
