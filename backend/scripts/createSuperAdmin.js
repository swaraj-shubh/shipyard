import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import Admin from "../models/Admin.js";

dotenv.config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const existing = await Admin.findOne({ email: "admin@platform.com" });
    if (existing) {
      console.log("⚠️ Super Admin already exists");
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash("Admin@123", 12);

    await Admin.create({
      name: "Super Admin",
      email: "admin@platform.com",
      password: hashedPassword,
      superAdmin: true,
    });

    console.log("✅ Super Admin created successfully");
    process.exit(0);
  } catch (err) {
    console.error("❌ Failed to create Super Admin", err);
    process.exit(1);
  }
})();
