const mongoose = require("mongoose");

const riderSchema = new mongoose.Schema(
  {
    // Link to the User account that belongs to this rider
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    name: String,
    phone: String,
    isAvailable: {
      type: Boolean,
      default: true,
    },
    currentOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Rider", riderSchema);
