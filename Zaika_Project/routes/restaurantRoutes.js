const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");
const restaurantController = require("../controllers/restaurantController");

router.get("/", restaurantController.getRestaurants);
router.post("/", auth, requireRole("admin", "owner"), restaurantController.createRestaurant);
router.put("/:id", auth, requireRole("admin", "owner"), restaurantController.updateRestaurant);
router.delete("/:id", auth, requireRole("admin", "owner"), restaurantController.deleteRestaurant);

module.exports = router;