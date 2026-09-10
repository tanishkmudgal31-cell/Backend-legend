const express = require("express");

const router = express.Router();

const {
  authMiddleware,
} = require("../middleware/auth.middleware");

const {
  createTransaction,
  getTransactions,
} = require("../controllers/transaction.controller");


// Get transaction history
router.get(
  "/",
  authMiddleware,
  getTransactions
);


// Create a new transaction
router.post(
  "/create",
  authMiddleware,
  createTransaction
);


module.exports = router;