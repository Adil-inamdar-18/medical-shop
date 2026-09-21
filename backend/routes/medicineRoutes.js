const express = require("express");

const {
  createMedicine,
  getMedicines,
  getMedicineById,
  updateMedicine,
  updateMedicineStock,
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

// Update Medicine Stock (manual, admin)
router.patch("/:id/stock", updateMedicineStock);

// Delete Medicine
router.delete("/:id", deleteMedicine);

module.exports = router;