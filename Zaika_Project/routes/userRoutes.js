const express = require("express");
const router = express.Router();

const { getProfile, updateProfile, getUsers, deleteUser } = require("../controllers/userController");
const auth = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

router.get("/profile", auth, getProfile);
router.put("/profile", auth, updateProfile);
router.get("/", auth, requireRole("admin"), getUsers);
router.delete("/:id", auth, requireRole("admin"), deleteUser);

module.exports = router;
