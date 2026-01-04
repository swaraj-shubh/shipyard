import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      lowercase: true,
      required: true,
      unique: true,
      index: true,
    },

    solanaPublicKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    role: {
      type: String,
      default: "user",
    },

    nonce: {
      type: String, // used for login signature
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
