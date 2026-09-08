const userModel = require("../models/user.models");
const jwt = require("jsonwebtoken");
const emailService = require("../services/email.service");

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 3 * 24 * 60 * 60 * 1000,
};


/**
 * User Register Controller
 * POST /api/auth/register
 */
async function userRegisterController(req, res) {
  try {
    const { email, password, name } = req.body;

    // Check required fields
    if (!email || !password || !name) {
      return res.status(400).json({
        message: "Email, password and name are required",
      });
    }

    // Check if user already exists
    const isExist = await userModel.findOne({ email });

    if (isExist) {
      return res.status(422).json({
        message: "User already exists with email",
        status: "failed",
      });
    }

    // Create user
    const user = await userModel.create({
      email,
      password,
      name,
    });

    // Create JWT
    const token = jwt.sign(
      {
        userId: user._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "3d",
      }
    );

    // Store token in secure HTTP-only cookie
    res.cookie("token", token, cookieOptions);

    // Send registration email
    try {
      await emailService.sendRegistrationEmail(
        user.email,
        user.name
      );
    } catch (emailError) {
      console.error(
        "Registration email failed:",
        emailError.message
      );
    }

    // Send response
    return res.status(201).json({
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
      },
      token,
    });

  } catch (error) {
    console.error("Registration error:", error);

    return res.status(500).json({
      message: "Unable to register user",
      error: error.message,
    });
  }
}


/**
 * User Login Controller
 * POST /api/auth/login
 */
async function userLoginController(req, res) {
  try {
    const { email, password } = req.body;

    // Check required fields
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // Find user
    const user = await userModel
      .findOne({ email })
      .select("+password");

    if (!user) {
      return res.status(401).json({
        message: "Email or password is invalid",
      });
    }

    // Check password
    const isValidPassword =
      await user.comparePassword(password);

    if (!isValidPassword) {
      return res.status(401).json({
        message: "Email or password is invalid",
      });
    }

    // Create JWT
    const token = jwt.sign(
      {
        userId: user._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "3d",
      }
    );

    // Store token in secure HTTP-only cookie
    res.cookie("token", token, cookieOptions);

    // Send response
    return res.status(200).json({
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
      },
      token,
    });

  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Unable to login",
      error: error.message,
    });
  }
}


/**
 * User Logout Controller
 * POST /api/auth/logout
 */
async function userLogoutController(req, res) {
  try {
    // Remove JWT cookie
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return res.status(200).json({
      message: "Logout successful",
    });

  } catch (error) {
    console.error("Logout error:", error);

    return res.status(500).json({
      message: "Something went wrong while logging out",
    });
  }
}


module.exports = {
  userRegisterController,
  userLoginController,
  userLogoutController,
};