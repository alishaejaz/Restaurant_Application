const Rider = require("../models/Rider");
const Order = require("../models/Order");
const User = require("../models/user");
const bcrypt = require("bcryptjs");

exports.createRider = async (req, res) => {
  try {
    const { name, phone, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Rider name, email, and password are required." });
    }

    let user = await User.findOne({ email });

    if (user && user.role !== 'rider') {
      return res.status(409).json({ error: "A non-rider user with this email already exists." });
    }

    if (!user) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user = await User.create({ name, email, password: hashedPassword, role: "rider" });
    }

    const existingRider = await Rider.findOne({ userId: user._id });
    if (existingRider) {
      return res.status(409).json({ error: "A rider profile already exists for this user." });
    }

    const rider = await Rider.create({ userId: user._id, name, phone });
    res.status(201).json(rider);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.assignOrder = async (req, res) => {
  try {
    const { riderId, orderId } = req.body;

    if (!riderId || !orderId) {
      return res.status(400).json({ message: "riderId and orderId are required" });
    }

    const rider = await Rider.findById(riderId);
    const order = await Order.findById(orderId);

    if (!rider) {
      return res.status(404).json({ message: "Rider not found" });
    }

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    rider.currentOrder = orderId;
    rider.isAvailable = false;
    await rider.save();

    order.rider = riderId;

    if (order.status === "Pending") {
      order.status = "Accepted";
    }

    await order.save();

    res.json({ rider, order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getRiders = async (req, res) => {
  try {
    const riders = await Rider.find().populate("currentOrder");
    res.json(riders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateRider = async (req, res) => {
  try {
    const rider = await Rider.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (!rider) {
      return res.status(404).json({ message: "Rider not found" });
    }

    res.json(rider);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteRider = async (req, res) => {
  try {
    const rider = await Rider.findByIdAndDelete(req.params.id);

    if (!rider) {
      return res.status(404).json({ message: "Rider not found" });
    }

    res.json({ message: "Rider deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
