const userModel = require("../models/user.models");
const jwt = require("jsonwebtoken");


async function authMiddleware(req, res, next) {
  try {

    /*
     * 1. Get token from cookie
     */
    let token = req.cookies.token;


    /*
     * 2. If token is not in cookie,
     *    check Authorization header
     *
     *    Authorization: Bearer <token>
     */
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;

      if (!authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
          message:
            "Unauthorized access, invalid authorization format",
        });
      }

      token = authHeader.split(" ")[1];
    }


    /*
     * 3. Check whether token exists
     */
    if (!token) {
      return res.status(401).json({
        message:
          "Unauthorized access, token is missing",
      });
    }


    /*
     * 4. Verify JWT
     */
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );


    /*
     * 5. Find user from decoded userId
     */
    const user = await userModel.findById(
      decoded.userId
    );


    /*
     * 6. Check whether user exists
     */
    if (!user) {
      return res.status(401).json({
        message:
          "Unauthorized access, user not found",
      });
    }


    /*
     * 7. Attach user to request
     */
    req.user = user;


    /*
     * 8. Continue to controller
     */
    return next();

  } catch (error) {

    console.error(
      "Authentication error:",
      error.message
    );

    return res.status(401).json({
      message:
        "Unauthorized access, token is invalid or expired",
    });
  }
}


/*
 * Export both names.
 *
 * authMiddleware = correct spelling
 *
 * authMidlleware = kept for compatibility with
 * your existing routes.
 */
module.exports = {
  authMiddleware,
  authMidlleware: authMiddleware,
};