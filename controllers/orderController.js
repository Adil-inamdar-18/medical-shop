const Order = require("../models/orderModel");

// Create Order
const createOrder = async (req, res) => {
  try {
    const { order_number, customer_id, items, status, notes } = req.body;

    // Basic validation
    if (!order_number || !customer_id || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order number, customer ID and items are required",
      });
    }

    // Calculate total amount on server
    const total_amount = items.reduce((total, item) => {
      return total + item.quantity * item.price;
    }, 0);

    const order = await Order.create({
      order_number,
      customer_id,
      items,
      total_amount,
      status,
      notes,
    });

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create order",
      error: error.message,
    });
  }
};

// Get All Orders
const getOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("customer_id")
      .populate("items.medicine_id")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
};

// Get Order By ID
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

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch order",
      error: error.message,
    });
  }
};

// Update Order
const updateOrder = async (req, res) => {
  try {
    const { items, status, notes } = req.body;

    const updateData = {};

    if (items) {
      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Order must contain at least one item",
        });
      }

      updateData.items = items;

      // Recalculate total when items are updated
      updateData.total_amount = items.reduce((total, item) => {
        return total + item.quantity * item.price;
      }, 0);
    }

    if (status !== undefined) {
      updateData.status = status;
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    const order = await Order.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("customer_id")
      .populate("items.medicine_id");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Order updated successfully",
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update order",
      error: error.message,
    });
  }
};

// Delete Order
const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Order deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete order",
      error: error.message,
    });
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
};
