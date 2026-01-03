import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      lowercase: true,
    },

    solanaPublicKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    superAdmin: {
      type: Boolean,
      default: false,
    },

    nonce: {
      type: String, // for wallet login
    },
  },
  { timestamps: true }
);

export default mongoose.model("Admin", adminSchema);
