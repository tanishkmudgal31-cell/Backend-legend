const accountModel = require("../models/account.model");


// Create account
async function createAccountController(req, res) {
  try {
    const { currency } = req.body;

    const account = await accountModel.create({
      user: req.user._id,
      currency: currency || "INR",
    });

    return res.status(201).json({
      message: "Account created successfully",
      account: {
        _id: account._id,
        user: account.user,
        currency: account.currency,
        status: account.status,
      },
    });

  } catch (error) {
    console.error("Error creating account:", error);

    return res.status(500).json({
      message: "Unable to create account",
      error: error.message,
    });
  }
}


// Get account balance
async function getBalance(req, res) {
  try {
    const { accountId } = req.params;

    const account = await accountModel.findById(accountId);

    if (!account) {
      return res.status(404).json({
        message: "Account not found",
      });
    }

    // Make sure the logged-in user owns this account
    if (account.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You are not authorized to access this account",
      });
    }

    if (account.status === "CLOSED") {
      return res.status(400).json({
        message: "Account is closed",
      });
    }

    const balance = await account.getBalance();

    return res.status(200).json({
      message: "Balance fetched successfully",
      accountId: account._id,
      balance,
      currency: account.currency,
    });

  } catch (error) {
    console.error("Error fetching balance:", error);

    return res.status(500).json({
      message: "Unable to fetch account balance",
      error: error.message,
    });
  }
}


module.exports = {
  createAccountController,
  getBalance,
};