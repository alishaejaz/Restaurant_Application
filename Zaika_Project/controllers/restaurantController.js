const Restaurant = require("../models/Restaurant");
const User = require("../models/user");
const mongoose = require("mongoose");

exports.getRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find().populate("owner", "name email role");
    res.json(restaurants);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createRestaurant = async (req, res) => {
  try {
    const { name, location, owner } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Restaurant name is required.' });
    }

    // If owner is provided, validate it's a valid ObjectId and that the user exists
    if (owner) {
      if (!mongoose.Types.ObjectId.isValid(owner)) {
        return res.status(400).json({ error: 'Invalid owner id. Provide a valid user ObjectId.' });
      }

      const user = await User.findById(owner);
      if (!user) {
        return res.status(404).json({ error: 'Owner user not found.' });
      }

      // Ensure the selected user is an owner (or admin)
      if (user.role !== 'owner' && user.role !== 'admin') {
        return res.status(400).json({ error: `User exists but is not an owner (role=${user.role}). Use a user with role 'owner'.` });
      }
    }

    const restaurant = await Restaurant.create({ name, location, owner: owner || undefined });
    res.status(201).json(restaurant);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateRestaurant = async (req, res) => {
  try {
    const update = { ...req.body };

    if (update.owner) {
      if (!mongoose.Types.ObjectId.isValid(update.owner)) {
        return res.status(400).json({ error: 'Invalid owner id. Provide a valid user ObjectId.' });
      }

      const user = await User.findById(update.owner);
      if (!user) return res.status(404).json({ error: 'Owner user not found.' });
      if (user.role !== 'owner' && user.role !== 'admin') {
        return res.status(400).json({ error: `User exists but is not an owner (role=${user.role}). Use a user with role 'owner'.` });
      }
    }

    const restaurant = await Restaurant.findByIdAndUpdate(req.params.id, update, { new: true });

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    res.json(restaurant);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findByIdAndDelete(req.params.id);

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    res.json({ message: "Restaurant deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};