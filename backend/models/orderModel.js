const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    order_number: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    customer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },

    items: [
      {
        medicine_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Medicine",
          required: true,
        },

        medicine_name: {
          type: String,
          required: true,
          trim: true,
        },

        quantity: {
          type: Number,
          required: true,
          min: 1,
        },

        price: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],

    // Amount before GST
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    // GST percentage
    gst_percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 0,
    },

    // GST amount
    gst_amount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    // Final amount including GST
    total_amount: {
      type: Number,
      required: true,
      min: 0,
    },

    // Order status
    status: {
      type: String,
      enum: ["pending", "confirmed", "partial"],
      default: "pending",
    },

    // Payment status
    payment_status: {
      type: String,
      enum: ["pending", "confirmed", "partial"],
      default: "pending",
    },

    // Amount already paid
    amount_paid: {
      type: Number,
      min: 0,
      default: 0,
    },

    // Remaining amount to be paid
    remaining_amount: {
      type: Number,
      min: 0,
      default: 0,
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

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;