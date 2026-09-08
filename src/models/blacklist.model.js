const mongoose = require("mongoose");


const blacklistSchema = new mongoose.Schema(
  {
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "account",
      required: [
        true,
        "Blacklist must be associated with an account",
      ],
      immutable: true,
    },


    reason: {
      type: String,
      required: [
        true,
        "Reason for blacklisting is required",
      ],
      trim: true,
      maxlength: [
        500,
        "Reason cannot exceed 500 characters",
      ],
    },


    blacklistedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: [
        true,
        "Blacklisted by is required",
      ],
      immutable: true,
    },


    status: {
      type: String,
      enum: {
        values: ["ACTIVE", "REMOVED"],
        message:
          "Status can either be ACTIVE or REMOVED",
      },
      default: "ACTIVE",
      index: true,
    },


    blacklistedAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },


    removedAt: {
      type: Date,
      default: null,
    },


    removedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      default: null,
    },


    removalReason: {
      type: String,
      default: null,
      trim: true,
      maxlength: [
        500,
        "Removal reason cannot exceed 500 characters",
      ],
    },
  },
  {
    timestamps: true,
  }
);


// Index for quickly checking active blacklist
// records for an account
blacklistSchema.index({
  account: 1,
  status: 1,
});


// Only one ACTIVE blacklist record
// can exist for one account
blacklistSchema.index(
  { account: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: "ACTIVE",
    },
  }
);


const blacklistModel = mongoose.model(
  "blacklist",
  blacklistSchema
);


module.exports = blacklistModel;