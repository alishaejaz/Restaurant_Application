const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  rider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Rider",
    default: null,
  },
  items: [
    {
      name: String,
      price: Number,
      quantity: Number,
    },
  ],
  total: Number,
  status: {
    type: String,
    enum: ["Pending", "Accepted", "Preparing", "Out for delivery", "Delivered", "Cancelled"],
    default: "Pending",
  },
  deliveryAddress: String,
});

module.exports = mongoose.model("Order", orderSchema);
