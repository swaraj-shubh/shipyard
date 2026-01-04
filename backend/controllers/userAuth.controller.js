// controllers/userAuth.controller.js
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { signToken } from "../utils/jwt.js";
import { generateSolanaWallet } from "../utils/solanaWallet.js";
import { encrypt } from "../utils/encrypt.js";

export const userRegister = async (req, res) => {
  try {
    const { name, email, solanaPublicKey } = req.body;

    if (!name || !solanaPublicKey) {
      return res.status(400).json({ message: "Name and wallet required" });
    }

    const exists = await User.findOne({ solanaPublicKey });
    if (exists) {
      return res.status(409).json({ message: "Wallet already registered" });
    }

    const user = await User.create({
      name,
      email,
      solanaPublicKey,
    });

    const token = signToken({
      id: user._id,
      role: "user",
    });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        solanaPublicKey: user.solanaPublicKey,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Registration failed" });
  }
};

export const userLogin = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ message: "Invalid credentials" });

  const token = signToken({ id: user._id, role: "user" });

  res.json({ token, user: { id: user._id, email: user.email } });
};
// make getMe for both user and admin
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

  res.json({ token, admin: { id: admin._id, email: admin.email } });
};

export const getMe = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select(
      "-password -solanaPrivateKey"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("GetMe error:", err);
    res.status(500).json({ message: "Failed to fetch user data" });
  }
};

import crypto from "crypto";

export const requestNonce = async (req, res) => {
  const { solanaPublicKey } = req.body;

  const user = await User.findOne({ solanaPublicKey });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const nonce = crypto.randomBytes(16).toString("hex");
  user.nonce = nonce;
  await user.save();

  res.json({ nonce });
};

import nacl from "tweetnacl";
import bs58 from "bs58";

export const verifySignature = async (req, res) => {
  const { solanaPublicKey, signature } = req.body;

  const user = await User.findOne({ solanaPublicKey });
  if (!user || !user.nonce) {
    return res.status(401).json({ message: "Invalid login attempt" });
  }

  const message = new TextEncoder().encode(user.nonce);
  const sig = bs58.decode(signature);
  const pubKey = bs58.decode(solanaPublicKey);

  const valid = nacl.sign.detached.verify(message, sig, pubKey);

  if (!valid) {
    return res.status(401).json({ message: "Signature verification failed" });
  }

  user.nonce = null;
  await user.save();

  const token = signToken({
    id: user._id,
    role: "user",
  });

  res.json({
    token,
    user: {
      id: user._id,
      solanaPublicKey: user.solanaPublicKey,
    },
  });
};
