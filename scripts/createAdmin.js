require("dotenv").config();

const mongoose = require("mongoose");

const connectDB = require("../src/config/db");
const userModel = require("../src/models/user.models");


async function createAdmin() {
  try {

    /*
     * 1. Check admin credentials
     *    from .env
     */

    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      throw new Error(
        "ADMIN_EMAIL and ADMIN_PASSWORD must be present in .env"
      );
    }


    /*
     * 2. Basic password check
     */

    if (adminPassword.length < 8) {
      throw new Error(
        "ADMIN_PASSWORD must be at least 8 characters"
      );
    }


    /*
     * 3. Connect to MongoDB
     */

    await connectDB();


    /*
     * 4. Check whether this email already exists
     */

    const existingUser = await userModel.findOne({
      email: adminEmail.toLowerCase().trim(),
    });


    /*
     * IMPORTANT:
     *
     * We do NOT automatically promote an existing
     * user to ADMIN.
     *
     * This prevents accidentally turning a normal
     * user into an administrator.
     */

    if (existingUser) {
      throw new Error(
        "A user with this email already exists. Admin was NOT created."
      );
    }


    /*
     * 5. Create ADMIN
     */

    const admin = await userModel.create({
      email: adminEmail.toLowerCase().trim(),
      name: "System Admin",
      password: adminPassword,
      role: "ADMIN",
    });


    /*
     * 6. Success
     */

    console.log("----------------------------------");
    console.log("ADMIN CREATED SUCCESSFULLY");
    console.log("----------------------------------");
    console.log("Admin ID:", admin._id.toString());
    console.log("Admin Email:", admin.email);
    console.log("Role:", admin.role);
    console.log("----------------------------------");

  } catch (error) {

    console.error(
      "Failed to create admin:",
      error.message
    );

    process.exitCode = 1;

  } finally {

    /*
     * Close MongoDB connection
     */

    await mongoose.connection.close();
  }
}


createAdmin();