const mongoose = require("mongoose");

const connectDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Databse connected successfully");
  } catch (error) {
    console.log("MongoDB connection error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDb;
