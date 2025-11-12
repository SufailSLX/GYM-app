const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const User = require("../models/User");

dotenv.config();

const seedUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");

    // Check if owner user exists
    const existingOwner = await User.findOne({ email: "gym@mail.com" });
    if (existingOwner) {
      console.log("Owner user already exists");
      process.exit(0);
    }

    // Create owner user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("admin123", salt);

    const owner = await User.create({
      name: "GYM Owner",
      email: "gym@mail.com",
      password: hashedPassword,
      isSubscribed: true,
    });

    console.log("Owner user created:", owner.email);

    // Create test user
    const existingUser = await User.findOne({ email: "user@mail.com" });
    if (!existingUser) {
      const userPassword = await bcrypt.hash("user123", salt);
      const user = await User.create({
        name: "Test User",
        email: "user@mail.com",
        password: userPassword,
        isSubscribed: false,
      });
      console.log("Test user created:", user.email);
    }

    process.exit(0);
  } catch (error) {
    console.error("Error seeding users:", error);
    process.exit(1);
  }
};

seedUsers();