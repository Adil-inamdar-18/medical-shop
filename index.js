require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDb = require("./config/db");
const customerRoutes = require("./routes/customerRoutes");

const app = express();
const port = process.env.PORT;

// middleware
app.use(cors());
app.use(express.json());

// routes
app.use("/api/customers", customerRoutes);
// database
connectDb();

// server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
