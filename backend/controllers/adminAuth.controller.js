// controllers/adminAuth.controller.js
import Admin from "../models/Admin.js";
import bcrypt from "bcryptjs";
import { signToken } from "../utils/jwt.js";

// Super admin registration (solanaPublicKey + name + email)
export const adminRegister = async (req, res) => {
  try {
    const { name, email, solanaPublicKey } = req.body;

    if (!name || !solanaPublicKey) {
      return res.status(400).json({ message: "Name and wallet required" });
    }

    const exists = await Admin.findOne({ solanaPublicKey });
    if (exists) {
      return res.status(409).json({ message: "Admin already exists" });
    }

    const admin = await Admin.create({
      name,
      email,
      solanaPublicKey,
      superAdmin: false,
    });

    const token = signToken({
      id: admin._id,
      role: "admin",
      superAdmin: admin.superAdmin,
    });

    res.status(201).json({
      token,
      admin: {
        id: admin._id,
        solanaPublicKey: admin.solanaPublicKey,
      },
    });
  } catch (err) {
    console.error("Admin register error:", err);
    res.status(500).json({ message: "Admin registration failed" });
  }
};


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

import crypto from "crypto";

export const adminRequestNonce = async (req, res) => {
  const { solanaPublicKey } = req.body;

  const admin = await Admin.findOne({ solanaPublicKey });
  if (!admin) {
    return res.status(404).json({ message: "Admin not found" });
  }

  const nonce = crypto.randomBytes(16).toString("hex");
  admin.nonce = nonce;
  await admin.save();

  res.json({ nonce });
};

import nacl from "tweetnacl";
import bs58 from "bs58";

export const adminVerifySignature = async (req, res) => {
  const { solanaPublicKey, signature } = req.body;

  const admin = await Admin.findOne({ solanaPublicKey });
  if (!admin || !admin.nonce) {
    return res.status(401).json({ message: "Invalid login attempt" });
  }

  const message = new TextEncoder().encode(admin.nonce);
  const sig = bs58.decode(signature);
  const pubKey = bs58.decode(solanaPublicKey);

  const valid = nacl.sign.detached.verify(message, sig, pubKey);
  if (!valid) {
    return res.status(401).json({ message: "Signature verification failed" });
  }

  admin.nonce = null;
  await admin.save();

  const token = signToken({
    id: admin._id,
    role: "admin",
    superAdmin: admin.superAdmin,
  });

  res.json({
    token,
    admin: {
      id: admin._id,
      solanaPublicKey: admin.solanaPublicKey,
    },
  });
};

export const getAdminMe = async (req, res) => {
  const admin = await Admin.findById(req.user.id);
  if (!admin) {
    return res.status(404).json({ message: "Admin not found" });
  }
  res.json(admin);
};
