// controllers/adminAuth.controller.js
import Admin from "../models/Admin.js";
import bcrypt from "bcryptjs";
import { signToken } from "../utils/jwt.js";

/**
 * Normal admin registration (email + password + name)
 * No superAdmin required
 */
export const adminSelfRegister = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters" });
    }

    // Check if admin already exists
    const exists = await Admin.findOne({ email });
    if (exists) {
      return res.status(409).json({ message: "Admin already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create admin
    const admin = await Admin.create({
      name,
      email,
      password: hashedPassword,
      superAdmin: false, // explicitly false
    });

    // Optional: auto-login after register
    const token = signToken({
      id: admin._id,
      role: "admin",
      superAdmin: admin.superAdmin,
    });

    return res.status(201).json({
      message: "Admin registered successfully",
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
      },
    });
  } catch (error) {
    console.error("Admin self-register error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

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
