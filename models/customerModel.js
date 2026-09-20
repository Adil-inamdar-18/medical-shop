const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    store_name: {
      type: String,
      required: true,
      trim: true,
    },

    customer_name: {
      type: String,
      required: true,
      trim: true,
    },

    mobile: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    city: {
      type: String,
      required: true,
      trim: true,
    },

    gst_number: {
      type: String,
      trim: true,
      uppercase: true,
    },

    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

const Customer = mongoose.model("Customer", customerSchema);

module.exports = Customer;
