// controllers/userAuth.controller.js
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { signToken } from "../utils/jwt.js";

export const userLogin = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ message: "Invalid credentials" });

  const token = signToken({ id: user._id, role: "user" });

  res.json({ token, user: { id: user._id, email: user.email } });
};

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

    const hashed = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      password: hashed,
    });

    const token = signToken({ id: user._id, role: "user" });

    res.status(201).json({
      token,
      user: { id: user._id, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ message: "Registration failed" });
  }
};
