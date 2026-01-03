// controllers/userAuth.controller.js
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { signToken } from "../utils/jwt.js";
import { generateSolanaWallet } from "../utils/solanaWallet.js";
import { encrypt } from "../utils/encrypt.js";

export const userRegister = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: "All fields required" });

    if (password.length < 8)
      return res.status(400).json({ message: "Password too short" });

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(409).json({ message: "User already exists" });

    // 🔐 Create Solana Wallet
    const { publicKey, privateKey } = generateSolanaWallet();

    const hashed = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      password: hashed,
      solanaPublicKey: publicKey,
      solanaPrivateKey: privateKey, // encrypted
    });

    const token = signToken({ id: user._id, role: "user" });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        solanaPublicKey: publicKey,
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

// export const userRegister = async (req, res) => {
//   try {
//     const { name, email, password } = req.body;

//     if (!name || !email || !password)
//       return res.status(400).json({ message: "All fields required" });

//     if (password.length < 8)
//       return res.status(400).json({ message: "Password too short" });

//     const exists = await User.findOne({ email });
//     if (exists)
//       return res.status(409).json({ message: "User already exists" });

//     const hashed = await bcrypt.hash(password, 12);

//     const user = await User.create({
//       name,
//       email,
//       password: hashed,
//     });

//     const token = signToken({ id: user._id, role: "user" });

//     res.status(201).json({
//       token,
//       user: { id: user._id, email: user.email },
//     });
//   } catch (err) {
//     res.status(500).json({ message: "Registration failed" });
//   }
// };
