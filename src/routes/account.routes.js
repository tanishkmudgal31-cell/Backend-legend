const express = require("express");

const {
  authMiddleware,
} = require("../middleware/auth.middleware");

const {
  createAccountController,
  getBalance,
} = require("../controllers/account.controller");

const router = express.Router();


// Create a new account
router.post(
  "/",
  authMiddleware,
  createAccountController
);


// Get account balance
router.get(
  "/balance/:accountId",
  authMiddleware,
  getBalance
);


module.exports = router;