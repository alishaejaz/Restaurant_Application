const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected");
    return true;
  } catch (error) {
    console.log(error);
    console.warn("MongoDB unavailable, starting API in fallback mode.");
    return false;
  }
};

module.exports = connectDB;
