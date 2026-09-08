const express = require("express");

const router = express.Router();

const {
  authMidlleware,
} = require("../middleware/auth.middleware");

const {
  createTransaction,
} = require("../controllers/transaction.controller");


// Create a new transaction
router.post(
  "/create",
  authMidlleware,
  createTransaction
);


module.exports = router;