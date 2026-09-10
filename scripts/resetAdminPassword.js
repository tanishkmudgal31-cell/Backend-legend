require("dotenv").config();

const mongoose = require("mongoose");

const connectDB = require("../src/config/db");
const userModel = require("../src/models/user.models");

async function resetAdminPassword() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      throw new Error(
        "ADMIN_EMAIL and ADMIN_PASSWORD must be present in .env"
      );
    }

    if (adminPassword.length < 8) {
      throw new Error(
        "ADMIN_PASSWORD must be at least 8 characters"
      );
    }

    await connectDB();

    const user = await userModel
      .findOne({
        email: adminEmail.toLowerCase().trim(),
      })
      .select("+password");

    if (!user) {
      throw new Error(
        "No user found with ADMIN_EMAIL. Create the admin first."
      );
    }

    // IMPORTANT:
    // Never promote a normal USER to ADMIN automatically.
    if (user.role !== "ADMIN") {
      throw new Error(
        "This email belongs to a normal USER, not an ADMIN. Password was NOT changed."
      );
    }

    user.password = adminPassword;

    await user.save();

    console.log("----------------------------------");
    console.log("ADMIN PASSWORD RESET SUCCESSFULLY");
    console.log("----------------------------------");
    console.log("Admin ID:", user._id.toString());
    console.log("Admin Email:", user.email);
    console.log("Role:", user.role);
    console.log("----------------------------------");
  } catch (error) {
    console.error(
      "Failed to reset admin password:",
      error.message
    );

    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

resetAdminPassword();