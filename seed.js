// Run this once with: node seed.js
// Creates the first admin account so you have a way to log in.
require("dotenv").config();
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const User = require("./models/User");

const createAdmin = async () => {
  await connectDB();

  const existing = await User.findOne({ email: "admin@school.com" });
  if (existing) {
    console.log("Admin already exists.");
    process.exit(0);
  }

  const hashedPassword = await bcrypt.hash("admin123", 10);

  await User.create({
    name: "Admin",
    email: "admin@school.com",
    password: hashedPassword,
    role: "admin",
  });

  console.log("Admin created: admin@school.com / admin123");
  mongoose.connection.close();
};

createAdmin();
