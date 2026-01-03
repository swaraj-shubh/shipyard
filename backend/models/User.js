// models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String, 
    required: true,
    trim: true
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  // 🔐 Solana Wallet
  solanaPublicKey: {
    type: String,
    required: true,
  },

  // ⚠️ OPTIONAL (encrypted if stored)
  solanaPrivateKey: {
    type: String,
    required: true,
    // select: false, // never return in queries
  },
}, { timestamps: true });

export default mongoose.model("User", userSchema);
