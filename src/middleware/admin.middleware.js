function adminMiddleware(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      message: "Unauthorized access",
    });
  }

  if (req.user.role !== "ADMIN") {
    return res.status(403).json({
      message:
        "Access denied. Admin privileges required.",
    });
  }

  return next();
}

module.exports = {
  adminMiddleware,
};