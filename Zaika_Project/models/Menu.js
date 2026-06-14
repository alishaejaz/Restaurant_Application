const mongoose = require("mongoose");

const menuSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: String,
  price: {
    type: Number,
    required: true,
  },
  category: String,
  imageUrl: String,
  isAvailable: {
    type: Boolean,
    default: true,
  },
});

module.exports = mongoose.model("Menu", menuSchema);
