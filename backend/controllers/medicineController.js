const Medicine = require("../models/medicineModel");

// Create Medicine
const createMedicine = async (req, res) => {
  try {
    const {
      medicine_name,
      price,
      stock,
      manufacturer,
      category,
      expiry_date,
      description,
    } = req.body;

    if (!medicine_name || price === undefined || stock === undefined) {
      return res.status(400).json({
        success: false,
        message: "Medicine name, price and stock are required",
      });
    }

    const medicine = await Medicine.create({
      medicine_name,
      price,
      stock,
      manufacturer,
      category,
      expiry_date,
      description,
    });

    res.status(201).json({
      success: true,
      message: "Medicine created successfully",
      data: medicine,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create medicine",
      error: error.message,
    });
  }
};

// Get All Medicines
const getMedicines = async (req, res) => {
  try {
    const medicines = await Medicine.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: medicines.length,
      data: medicines,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch medicines",
      error: error.message,
    });
  }
};

// Get Medicine By ID
const getMedicineById = async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: "Medicine not found",
      });
    }

    res.status(200).json({
      success: true,
      data: medicine,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch medicine",
      error: error.message,
    });
  }
};

// Update Medicine
const updateMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: "Medicine not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Medicine updated successfully",
      data: medicine,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update medicine",
      error: error.message,
    });
  }
};

// Update Medicine Stock (manual, admin only)
// Body: { stock: 120 }   -> set stock to an exact value
//   or  { change: -5 }   -> add / remove a number of units
const updateMedicineStock = async (req, res) => {
  try {
    const { stock, change } = req.body;

    let medicine;

    if (stock !== undefined) {
      if (!Number.isInteger(stock) || stock < 0) {
        return res.status(400).json({
          success: false,
          message: "Stock must be a whole number of 0 or more",
        });
      }

      medicine = await Medicine.findByIdAndUpdate(
        req.params.id,
        { stock },
        { new: true, runValidators: true },
      );
    } else if (change !== undefined) {
      if (!Number.isInteger(change) || change === 0) {
        return res.status(400).json({
          success: false,
          message: "Change must be a non-zero whole number",
        });
      }

      // Atomic update that refuses to take stock below zero
      medicine = await Medicine.findOneAndUpdate(
        { _id: req.params.id, stock: { $gte: -change } },
        { $inc: { stock: change } },
        { new: true },
      );

      if (!medicine && (await Medicine.exists({ _id: req.params.id }))) {
        return res.status(400).json({
          success: false,
          message: "Stock cannot go below zero",
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: "Send either stock or change",
      });
    }

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: "Medicine not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Stock updated successfully",
      data: medicine,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update stock",
      error: error.message,
    });
  }
};

// Delete Medicine
const deleteMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findByIdAndDelete(req.params.id);

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: "Medicine not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Medicine deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete medicine",
      error: error.message,
    });
  }
};

module.exports = {
  createMedicine,
  getMedicines,
  getMedicineById,
  updateMedicine,
  updateMedicineStock,
  deleteMedicine,
};
