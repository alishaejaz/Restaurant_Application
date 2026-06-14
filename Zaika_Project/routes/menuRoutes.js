const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");
const { addItem, getItems, updateItem, deleteItem, deleteAllItems } = require("../controllers/menuController");

// public
router.get("/", getItems);

// protected
router.post("/", auth, requireRole("admin", "owner"), addItem);
router.put("/:id", auth, requireRole("admin", "owner"), updateItem);
router.delete("/", auth, requireRole("admin"), deleteAllItems);
router.delete("/:id", auth, requireRole("admin", "owner"), deleteItem);

module.exports = router;
