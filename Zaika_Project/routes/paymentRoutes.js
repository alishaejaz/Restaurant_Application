const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const auth = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

router.post("/", auth, paymentController.createPayment);
router.get("/", auth, paymentController.getPayments);
router.put("/:id", auth, requireRole("admin"), paymentController.updatePaymentStatus);

module.exports = router;
