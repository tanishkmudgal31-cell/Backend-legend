const express = require("express");

const authController = require("../controllers/auth.controller");

const router = express.Router();


// Register
router.post(
  "/register",
  authController.userRegisterController
);


// Login
router.post(
  "/login",
  authController.userLoginController
);


// Logout
router.post(
  "/logout",
  authController.userLogoutController
);


module.exports = router;