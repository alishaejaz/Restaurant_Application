const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const { placeOrder, getOrders, updateOrder, deleteOrder } = require("../controllers/orderController");

router.post("/", auth, placeOrder);
router.get("/", auth, getOrders);
router.put("/:id", auth, updateOrder);
router.delete("/:id", auth, deleteOrder);

module.exports = router;
