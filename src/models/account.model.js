const mongoose = require("mongoose");
const ledgerModel = require("./ledger.model");

const accountSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: [true, "Account must be associated with user"],
      index: true,
    },

    status: {
      type: String,
      enum: {
        values: ["Active", "FROZEN", "CLOSED"],
        message: "Status can be either Active, Frozen or Closed",
      },
      default: "Active",
    },

    currency: {
      type: String,
      required: [true, "Currency is required for creating an account"],
      default: "INR",
    },
  },
  {
    timestamps: true,
  }
);


// Calculate account balance from ledger
accountSchema.methods.getBalance = async function (session) {
  const balanceData = await ledgerModel
    .aggregate([
      {
        $match: {
          account: this._id,
        },
      },

      {
        $group: {
          _id: "$type",
          total: {
            $sum: "$amount",
          },
        },
      },
    ])
    .session(session);

  let credit = 0;
  let debit = 0;

  balanceData.forEach((entry) => {
    if (entry._id === "CREDIT") {
      credit = entry.total;
    }

    if (entry._id === "DEBIT") {
      debit = entry.total;
    }
  });

  return credit - debit;
};


const accountModel = mongoose.model("account", accountSchema);

module.exports = accountModel;