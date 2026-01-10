const mongoose = require("mongoose");
require("dotenv").config();

// ❗ VERY IMPORTANT: disable buffering
mongoose.set("bufferCommands", false);

const connection = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
    });

    console.log("✅ Connected to MongoDB");

    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠ MongoDB disconnected");
    });

  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  }
};

module.exports = connection;
