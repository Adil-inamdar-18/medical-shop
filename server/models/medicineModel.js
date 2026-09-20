const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema(
  {
    medicine_name: {
      type: String,
      required: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    stock: {
      type: Number,
      required: true,
      min: 0,
    },

    manufacturer: {
      type: String,
      trim: true,
    },

    category: {
      type: String,
      trim: true,
    },

    expiry_date: {
      type: Date,
    },

    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

const Medicine = mongoose.model("Medicine", medicineSchema);

module.exports = Medicine;