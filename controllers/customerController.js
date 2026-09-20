const Customer = require("../models/customerModel");

// Create Customer
const createCustomer = async (req, res) => {
  try {
    const {
      store_name,
      customer_name,
      mobile,
      address,
      city,
      gst_number,
      notes,
    } = req.body;

    if (!store_name || !customer_name || !mobile || !address || !city) {
      return res.status(400).json({
        success: false,
        message:
          "store_name, customer_name, mobile, address and city are required",
      });
    }

    const customer = await Customer.create({
      store_name,
      customer_name,
      mobile,
      address,
      city,
      gst_number,
      notes,
    });

    return res.status(201).json({
      success: true,
      message: "Customer created successfully",
      data: customer,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to create customer",
      error: error.message,
    });
  }
};

// Get All Customers
const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: customers.length,
      data: customers,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch customers",
      error: error.message,
    });
  }
};

// Get Customer By ID
const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch customer",
      error: error.message,
    });
  }
};

// Update Customer
const updateCustomer = async (req, res) => {
  try {
    const {
      store_name,
      customer_name,
      mobile,
      address,
      city,
      gst_number,
      notes,
    } = req.body;

    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    if (store_name !== undefined) {
      customer.store_name = store_name;
    }

    if (customer_name !== undefined) {
      customer.customer_name = customer_name;
    }

    if (mobile !== undefined) {
      customer.mobile = mobile;
    }

    if (address !== undefined) {
      customer.address = address;
    }

    if (city !== undefined) {
      customer.city = city;
    }

    if (gst_number !== undefined) {
      customer.gst_number = gst_number;
    }

    if (notes !== undefined) {
      customer.notes = notes;
    }

    await customer.save();

    return res.status(200).json({
      success: true,
      message: "Customer updated successfully",
      data: customer,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to update customer",
      error: error.message,
    });
  }
};

// Delete Customer
const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to delete customer",
      error: error.message,
    });
  }
};

module.exports = {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
};
