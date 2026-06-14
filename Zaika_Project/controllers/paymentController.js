const Payment = require("../models/Payment");

exports.createPayment = async (req, res) => {
  try {
    const { orderId, amount, method } = req.body;

    const payment = await Payment.create({
      orderId,
      userId: req.user.id,
      amount,
      method,
      status: "completed",
    });

    res.status(201).json(payment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPayments = async (req, res) => {
  try {
    const filters = req.user.role === "admin" ? {} : { userId: req.user.id };
    const payments = await Payment.find(filters).populate("userId orderId");
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updatePaymentStatus = async (req, res) => {
  try {
    const payment = await Payment.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    res.json(payment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
