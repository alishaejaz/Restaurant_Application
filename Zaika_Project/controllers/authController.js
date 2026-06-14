const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const allowedRoles = new Set(["user", "owner", "rider", "admin"]);
const demoAccounts = [
  { name: "Demo Customer", email: "customer@flavorloop.pk", password: "Customer123!", role: "user",  _id: "demo0000000000000000001" },
  { name: "Demo Owner",    email: "owner@flavorloop.pk",    password: "Owner123!",    role: "owner", _id: "demo0000000000000000002" },
  { name: "Demo Rider",    email: "rider@flavorloop.pk",    password: "Rider123!",    role: "rider", _id: "demo0000000000000000003" },
  { name: "Demo Admin",    email: "admin@flavorloop.pk",    password: "Admin123!",    role: "admin", _id: "demo0000000000000000004" },
];

const createToken = (userId, role) =>
  jwt.sign({ id: userId, role }, process.env.JWT_SECRET, { expiresIn: "1d" });

const respondWithDemoLogin = (res, account) => {
  // Use the stable demo _id (not email) so req.user.id is consistent with DB usage
  const token = createToken(account._id, account.role);

  return res.json({
    message: "Login successful",
    token,
    user: {
      id:    account._id,
      name:  account.name,
      email: account.email,
      role:  account.role,
    },
  });
};

// Register
exports.register = async (req, res) => {
  const { name, email, password, role = "user" } = req.body;

  if (!name || !email || !password)
    return res.status(400).json({ msg: "Missing fields" });

  if (!allowedRoles.has(role)) {
    return res.status(400).json({ msg: "Invalid role" });
  }

  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ msg: "Database unavailable. Start MongoDB to register a new account." });
  }

  const userExists = await User.findOne({ email });
  if (userExists) return res.status(409).json({ msg: "Email already exists" });

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role,
  });

  const token = createToken(user._id, user.role);

  res.status(201).json({
    id:    user._id,
    name:  user.name,
    email: user.email,
    role:  user.role,
    token,
  });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (mongoose.connection.readyState !== 1) {
    const account = demoAccounts.find(
      (item) => item.email === email && item.password === password
    );

    if (!account) {
      return res.status(401).json({ msg: "Invalid credentials" });
    }

    return respondWithDemoLogin(res, account);
  }

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(401).json({ msg: "Invalid credentials" });
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return res.status(401).json({ msg: "Invalid credentials" });
  }

  const token = createToken(user._id, user.role);

  return res.json({
    message: "Login successful",
    token,
    user: {
      id:    user._id,
      name:  user.name,
      email: user.email,
      role:  user.role,
    },
  });
};
