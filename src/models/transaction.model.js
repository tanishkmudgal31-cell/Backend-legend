const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: {
        values: ["TRANSFER", "DEPOSIT", "WITHDRAWAL"],
        message: "Invalid transaction type",
      },
      required: [true, "Transaction type is required"],
    },

    amount: {
      type: Number,
      required: [true, "Transaction amount is required"],
      min: [0.01, "Amount must be greater than 0"],
    },

    fromAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "account",
      required: function () {
        return (
          this.type === "TRANSFER" ||
          this.type === "WITHDRAWAL"
        );
      },
    },

    toAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "account",
      required: function () {
        return (
          this.type === "TRANSFER" ||
          this.type === "DEPOSIT"
        );
      },
    },

    status: {
      type: String,
      enum: {
        values: [
          "PENDING",
          "COMPLETED",
          "FAILED",
          "REVERSED",
        ],
        message: "Invalid transaction status",
      },
      default: "PENDING",
    },

    description: {
      type: String,
      trim: true,
      maxlength: [
        200,
        "Description cannot exceed 200 characters",
      ],
    },

    reference: {
      type: String,
      unique: true,
      index: true,
      sparse: true,
    },

    // Used to prevent duplicate transactions
    idempotentKey: {
      type: String,
      required: [true, "Idempotent key is required"],
      unique: true,
      index: true,
      immutable: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const transactionModel = mongoose.model(
  "transaction",
  transactionSchema
);

module.exports = transactionModel;