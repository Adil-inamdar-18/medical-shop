const Order = require("../models/orderModel");
const Medicine = require("../models/medicineModel");

// Fixed GST percentage
const FIXED_GST_PERCENTAGE = 12;

// Builds the next order number, e.g. ORD-2026-001
const generateOrderNumber = async () => {
  const year = new Date().getFullYear();
  const prefix = `ORD-${year}-`;

  const count = await Order.countDocuments({
    order_number: new RegExp(`^${prefix}`),
  });

  return `${prefix}${String(count + 1).padStart(3, "0")}`;
};

const roundAmount = (amount) => Number(Number(amount).toFixed(2));

const calculateAmounts = (items, amountPaid = 0) => {
  const subtotal = items.reduce((total, item) => {
    return total + Number(item.quantity) * Number(item.price);
  }, 0);

  const gstAmount = subtotal * (FIXED_GST_PERCENTAGE / 100);

  const totalAmount = subtotal + gstAmount;

  const paidAmount = Number(amountPaid);

  const remainingAmount = totalAmount - paidAmount;

  return {
    subtotal: roundAmount(subtotal),

    gst_percentage: FIXED_GST_PERCENTAGE,

    gst_amount: roundAmount(gstAmount),

    total_amount: roundAmount(totalAmount),

    amount_paid: roundAmount(paidAmount),

    remaining_amount: roundAmount(Math.max(remainingAmount, 0)),
  };
};

const validatePayment = (paymentStatus, amountPaid, totalAmount) => {
  if (!["pending", "confirmed", "partial"].includes(paymentStatus)) {
    return "Invalid payment status";
  }

  if (!Number.isFinite(amountPaid) || amountPaid < 0) {
    return "Amount paid must be a valid non-negative number";
  }

  if (amountPaid > totalAmount) {
    return "Amount paid cannot be greater than total amount";
  }

  if (paymentStatus === "pending" && amountPaid !== 0) {
    return "Pending payment must have amount paid as 0";
  }

  if (paymentStatus === "confirmed" && amountPaid !== totalAmount) {
    return "Confirmed payment must have amount paid equal to total amount";
  }

  if (paymentStatus === "partial") {
    if (amountPaid <= 0) {
      return "Partial payment must have an amount greater than 0";
    }

    if (amountPaid >= totalAmount) {
      return "Partial payment must be less than total amount";
    }
  }

  return null;
};

// Create Order
const createOrder = async (req, res) => {
  try {
    const {
      customer_id,
      items,
      payment_status = "pending",
      amount_paid = 0,
      notes,
    } = req.body;

    let { order_number } = req.body;

    if (!customer_id || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Customer ID and items are required",
      });
    }

    // Validate order items
    for (const item of items) {
      if (
        !item.medicine_id ||
        !item.medicine_name ||
        !Number.isInteger(Number(item.quantity)) ||
        Number(item.quantity) < 1 ||
        !Number.isFinite(Number(item.price)) ||
        Number(item.price) < 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid order item data",
        });
      }
    }

    // Calculate subtotal, GST, total,
    // paid amount and remaining amount
    const amounts = calculateAmounts(items, Number(amount_paid));

    // Validate payment
    const paymentError = validatePayment(
      payment_status,
      amounts.amount_paid,
      amounts.total_amount,
    );

    if (paymentError) {
      return res.status(400).json({
        success: false,
        message: paymentError,
      });
    }

    /*
     * Order status follows payment status.
     *
     * pending   -> pending
     * confirmed -> confirmed
     * partial   -> partial
     */
    const status = payment_status;

    const autoNumber = !order_number;

    let order;

    // Try multiple times in case two orders
    // generate the same order number
    for (let attempt = 0; attempt < 5; attempt++) {
      if (autoNumber) {
        order_number = await generateOrderNumber();
      }

      try {
        order = await Order.create({
          order_number,

          customer_id,

          items,

          subtotal: amounts.subtotal,

          gst_percentage: amounts.gst_percentage,

          gst_amount: amounts.gst_amount,

          total_amount: amounts.total_amount,

          status,

          payment_status,

          amount_paid: amounts.amount_paid,

          remaining_amount: amounts.remaining_amount,

          notes,
        });

        break;
      } catch (error) {
        const duplicate = error.code === 11000;

        if (!(duplicate && autoNumber && attempt < 4)) {
          throw error;
        }
      }
    }

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: populatedOrder,
    });
  } catch (error) {
    return res.status(error.name === "ValidationError" ? 400 : 500).json({
      success: false,
      message: "Failed to create order",
      error: error.message,
    });
  }
};

// Get all orders
const getOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("customer_id")
      .populate("items.medicine_id")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
};

// Get single order
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("customer_id")
      .populate("items.medicine_id");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch order",
      error: error.message,
    });
  }
};

// Update Order
const updateOrder = async (req, res) => {
  try {
    const { items, status, payment_status, amount_paid, notes } = req.body;

    const existingOrder = await Order.findById(req.params.id);

    if (!existingOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const updateData = {};

    const updatedItems = items !== undefined ? items : existingOrder.items;

    if (!Array.isArray(updatedItems) || updatedItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order must contain at least one item",
      });
    }

    // Validate order items
    for (const item of updatedItems) {
      if (
        !item.medicine_id ||
        !item.medicine_name ||
        !Number.isInteger(Number(item.quantity)) ||
        Number(item.quantity) < 1 ||
        !Number.isFinite(Number(item.price)) ||
        Number(item.price) < 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid order item data",
        });
      }
    }

    const finalPaymentStatus =
      payment_status !== undefined
        ? payment_status
        : existingOrder.payment_status;

    const finalAmountPaid =
      amount_paid !== undefined
        ? Number(amount_paid)
        : Number(existingOrder.amount_paid || 0);

    const amounts = calculateAmounts(updatedItems, finalAmountPaid);

    const paymentError = validatePayment(
      finalPaymentStatus,
      amounts.amount_paid,
      amounts.total_amount,
    );

    if (paymentError) {
      return res.status(400).json({
        success: false,
        message: paymentError,
      });
    }

    /*
     * Keep order status synchronized
     * with payment status.
     */
    const finalStatus =
      payment_status !== undefined
        ? finalPaymentStatus
        : status !== undefined
          ? status
          : existingOrder.status;

    updateData.items = updatedItems;

    updateData.subtotal = amounts.subtotal;

    updateData.gst_percentage = amounts.gst_percentage;

    updateData.gst_amount = amounts.gst_amount;

    updateData.total_amount = amounts.total_amount;

    updateData.payment_status = finalPaymentStatus;

    updateData.amount_paid = amounts.amount_paid;

    updateData.remaining_amount = amounts.remaining_amount;

    updateData.status = finalStatus;

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const order =
      await Order.findByIdAndUpdate(
        req.params.id,
        updateData,
        {
          new: true,
          runValidators: true,
        },
      )
        .populate("customer_id")
        .populate("items.medicine_id");

    return res.status(200).json({
      success: true,
      message: "Order updated successfully",
      data: order,
    });
  } catch (error) {
    return res.status(error.name === "ValidationError" ? 400 : 500).json({
      success: false,
      message: "Failed to update order",
      error: error.message,
    });
  }
};

// =====================================================
// Delete Order
// =====================================================

const deleteOrder = async (req, res) => {
  try {
    const order =
      await Order.findByIdAndDelete(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Order deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete order",
      error: error.message,
    });
  }
};

// =====================================================
// Export
// =====================================================

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
};