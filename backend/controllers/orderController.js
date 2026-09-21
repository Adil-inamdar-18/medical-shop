const Order = require("../models/orderModel");

// Builds the next order number, e.g. ORD-2026-001
const generateOrderNumber = async () => {
  const year = new Date().getFullYear();
  const prefix = `ORD-${year}-`;
  const count = await Order.countDocuments({
    order_number: new RegExp(`^${prefix}`),
  });

  return `${prefix}${String(count + 1).padStart(3, "0")}`;
};

// Create Order
//
// NOTE: Medicine stock is intentionally NOT reduced here. Stock is managed
// manually by the admin (Admin Panel -> Medicine Inventory).
const createOrder = async (req, res) => {
  try {
    const { customer_id, items, status, notes } = req.body;
    let { order_number } = req.body;

    // Basic validation
    if (!customer_id || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Customer ID and items are required",
      });
    }

    // Calculate total amount on server
    const total_amount = items.reduce((total, item) => {
      return total + item.quantity * item.price;
    }, 0);

    // Auto-generate the order number when the client does not send one.
    // Retry a few times in case two orders are created at the same moment.
    const autoNumber = !order_number;
    let order;

    for (let attempt = 0; attempt < 5; attempt++) {
      if (autoNumber) {
        order_number = await generateOrderNumber();
      }

      try {
        order = await Order.create({
          order_number,
          customer_id,
          items,
          total_amount,
          status,
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

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: order,
    });
  } catch (error) {
    res.status(error.name === "ValidationError" ? 400 : 500).json({
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

// Update Order (status / items / notes only - stock is never touched)
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
    res.status(error.name === "ValidationError" ? 400 : 500).json({
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
