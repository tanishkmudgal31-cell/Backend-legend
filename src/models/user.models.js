const mongoose = require("mongoose");
const bcrypt = require("bcrypt");


const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,

      required: [
        true,
        "Email is required",
      ],

      lowercase: true,
      trim: true,

      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please fill a valid email address",
      ],

      unique: true,
    },


    name: {
      type: String,

      required: [
        true,
        "Name is required for creating account",
      ],

      trim: true,
    },


    password: {
      type: String,

      required: [
        true,
        "Password is required for creating an account",
      ],

      minlength: [
        8,
        "Password must be at least 8 characters",
      ],

      select: false,
    },


    /*
     * User role
     *
     * Public registration will always create
     * a USER.
     *
     * ADMIN users will be created separately
     * through the secure admin setup process.
     */
    role: {
      type: String,

      enum: {
        values: ["USER", "ADMIN"],
        message: "Role can either be USER or ADMIN",
      },

      default: "USER",

      index: true,
    },
  },

  {
    timestamps: true,
  }
);


/*
 * Hash password before saving
 */
userSchema.pre("save", async function (next) {

  if (!this.isModified("password")) {
    return next();
  }

  this.password = await bcrypt.hash(
    this.password,
    10
  );

  next();
});


/*
 * Compare entered password with hashed password
 */
userSchema.methods.comparePassword = async function (
  password
) {
  return await bcrypt.compare(
    password,
    this.password
  );
};


const userModel = mongoose.model(
  "user",
  userSchema
);


module.exports = userModel;