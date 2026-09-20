const express = require("express");

const {
  createMedicine,
  getMedicines,
  getMedicineById,
  updateMedicine,
  deleteMedicine,
} = require("../controllers/medicineController");

const router = express.Router();

// Create Medicine
router.post("/", createMedicine);

// Get All Medicines
router.get("/", getMedicines);

// Get Medicine By ID
router.get("/:id", getMedicineById);

// Update Medicine
router.put("/:id", updateMedicine);

// Delete Medicine
router.delete("/:id", deleteMedicine);

module.exports = router;