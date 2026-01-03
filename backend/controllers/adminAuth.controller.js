// controllers/adminAuth.controller.js
import Admin from "../models/Admin.js";
import bcrypt from "bcryptjs";
import { signToken } from "../utils/jwt.js";

export const adminLogin = async (req, res) => {
  const { email, password } = req.body;

  const admin = await Admin.findOne({ email });
  if (!admin) return res.status(404).json({ message: "Admin not found" });

  const match = await bcrypt.compare(password, admin.password);
  if (!match) return res.status(400).json({ message: "Invalid credentials" });

  const token = signToken({
    id: admin._id,
    role: "admin",
    superAdmin: admin.superAdmin,
  });

  res.json({ token, admin: { email: admin.email } });
};

export const adminRegister = async (req, res) => {
  try {
    // 🔒 Only super admin can create admins
    if (!req.user?.superAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }

    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const exists = await Admin.findOne({ email });
    if (exists) {
      return res.status(409).json({ message: "Admin already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await Admin.create({
      name,
      email,
      password: hashedPassword,
    });

    res.status(201).json({ message: "Admin registered successfully" });
  } catch (error) {
    console.error("Admin register error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
