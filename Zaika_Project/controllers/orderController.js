const Order = require("../models/Order");
const Rider = require("../models/Rider");

exports.placeOrder = async (req, res) => {
  try {
    const { items, total, deliveryAddress } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ message: "Order items are required" });
    }

    const order = await Order.create({
      user: req.user.id,
      items,
      total,
      deliveryAddress,
    });

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOrders = async (req, res) => {
  try {
    let filters = {};

    if (req.user.role === "admin") {
      filters = {};
    } else if (req.user.role === "rider") {
      const rider = await Rider.findOne({ userId: req.user.id });

      if (!rider) {
        return res.json([]);
      }

      filters = { rider: rider._id };
    } else {
      filters = { user: req.user.id };
    }

    const orders = await Order.find(filters).populate("user rider");
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const role = req.user.role;
    const ownsOrder = String(order.user) === String(req.user.id);

    if (role === "user") {
      if (!ownsOrder) {
        return res.status(403).json({ message: "Not authorized" });
      }

      if (!req.body.status || req.body.status !== "Cancelled") {
        return res.status(403).json({ message: "Customers can only cancel orders" });
      }
    } else if (role === "rider") {
      const rider = await Rider.findOne({ userId: req.user.id });

      if (!rider || String(order.rider) !== String(rider._id)) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const allowedTransitions = {
        Accepted: ["Preparing"],
        Preparing: ["Out for delivery"],
        "Out for delivery": ["Delivered"],
      };

      if (!allowedTransitions[order.status]?.includes(req.body.status)) {
        return res.status(403).json({ message: "Riders can only advance assigned orders through the delivery workflow" });
      }
    } else if (role !== "admin" && role !== "owner") {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (!req.body.status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    ).populate("user rider");

    if (updatedOrder?.status === "Delivered" && updatedOrder.rider) {
      const assignedRider = await Rider.findById(updatedOrder.rider);

      if (assignedRider) {
        assignedRider.isAvailable = true;
        assignedRider.currentOrder = null;
        await assignedRider.save();
      }
    }

    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const ownsOrder = String(order.user) === String(req.user.id);

    if (req.user.role !== "admin" && !ownsOrder) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: "Order deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
