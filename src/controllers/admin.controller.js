const mongoose = require("mongoose");

const accountModel = require("../models/account.model");
const blacklistModel = require("../models/blacklist.model");

async function blacklistAccount(req, res) {
  try {
    const { accountId, reason } = req.body;

    if (!accountId || !reason || !reason.trim()) {
      return res.status(400).json({
        message: "accountId and reason are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(accountId)) {
      return res.status(400).json({
        message: "Invalid account ID",
      });
    }

    const account = await accountModel.findById(accountId);

    if (!account) {
      return res.status(404).json({
        message: "Account not found",
      });
    }

    const existingBlacklist =
      await blacklistModel.findOne({
        account: accountId,
        status: "ACTIVE",
      });

    if (existingBlacklist) {
      return res.status(409).json({
        message: "Account is already blacklisted",
        blacklist: existingBlacklist,
      });
    }

    const blacklist = await blacklistModel.create({
      account: accountId,
      reason: reason.trim(),
      blacklistedBy: req.user._id,
      status: "ACTIVE",
    });

    return res.status(201).json({
      message: "Account blacklisted successfully",
      blacklist,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Account is already blacklisted",
      });
    }

    console.error(
      "Blacklist account error:",
      error.message
    );

    return res.status(500).json({
      message: "Unable to blacklist account",
      error: error.message,
    });
  }
}

async function removeBlacklist(req, res) {
  try {
    const { accountId } = req.params;
    const { removalReason } = req.body;

    if (!mongoose.Types.ObjectId.isValid(accountId)) {
      return res.status(400).json({
        message: "Invalid account ID",
      });
    }

    const blacklist =
      await blacklistModel.findOne({
        account: accountId,
        status: "ACTIVE",
      });

    if (!blacklist) {
      return res.status(404).json({
        message:
          "No active blacklist found for this account",
      });
    }

    blacklist.status = "REMOVED";
    blacklist.removedAt = new Date();
    blacklist.removedBy = req.user._id;
    blacklist.removalReason =
      removalReason?.trim() ||
      "Blacklist removed by admin";

    await blacklist.save();

    return res.status(200).json({
      message:
        "Account removed from blacklist successfully",
      blacklist,
    });
  } catch (error) {
    console.error(
      "Remove blacklist error:",
      error.message
    );

    return res.status(500).json({
      message:
        "Unable to remove account from blacklist",
      error: error.message,
    });
  }
}

async function getBlacklistStatus(req, res) {
  try {
    const { accountId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(accountId)) {
      return res.status(400).json({
        message: "Invalid account ID",
      });
    }

    const blacklist =
      await blacklistModel
        .findOne({
          account: accountId,
        })
        .sort({
          createdAt: -1,
        })
        .populate("account")
        .populate(
          "blacklistedBy",
          "name email role"
        )
        .populate(
          "removedBy",
          "name email role"
        );

    if (!blacklist) {
      return res.status(404).json({
        message:
          "No blacklist record found for this account",
      });
    }

    return res.status(200).json({
      message:
        "Blacklist status fetched successfully",
      blacklist,
    });
  } catch (error) {
    console.error(
      "Get blacklist status error:",
      error.message
    );

    return res.status(500).json({
      message:
        "Unable to fetch blacklist status",
      error: error.message,
    });
  }
}

module.exports = {
  blacklistAccount,
  removeBlacklist,
  getBlacklistStatus,
};