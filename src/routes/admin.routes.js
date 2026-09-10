const express = require("express");

const {
  authMiddleware,
} = require("../middleware/auth.middleware");

const {
  adminMiddleware,
} = require("../middleware/admin.middleware");

const {
  blacklistAccount,
  removeBlacklist,
  getBlacklistStatus,
} = require("../controllers/admin.controller");

const router = express.Router();

router.post(
  "/blacklist",
  authMiddleware,
  adminMiddleware,
  blacklistAccount
);

router.patch(
  "/blacklist/:accountId/remove",
  authMiddleware,
  adminMiddleware,
  removeBlacklist
);

router.get(
  "/blacklist/:accountId",
  authMiddleware,
  adminMiddleware,
  getBlacklistStatus
);

module.exports = router;