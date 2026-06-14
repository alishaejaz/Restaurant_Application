const express = require("express");
const router = express.Router();
const riderController = require("../controllers/riderController");
const auth = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

// Admins can manage riders; riders can view their own list
router.post("/", auth, requireRole("admin"), riderController.createRider);
router.get("/", auth, riderController.getRiders);           // riders + admins can list
router.put("/assign", auth, requireRole("admin"), riderController.assignOrder);
router.put("/:id", auth, riderController.updateRider);      // rider can update own availability
router.delete("/:id", auth, requireRole("admin"), riderController.deleteRider);

module.exports = router;
