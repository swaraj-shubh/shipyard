import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  label: String,
  type: {
    type: String,
    enum: ["text", "email", "number", "textarea", "select", "checkbox", "radio", "file"],
    required: true
  },
  options: [String],
  required: Boolean
});

const formSchema = new mongoose.Schema({
  title: String,
  type: String,
  description: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin"
  },
  isActive: {
    type: Boolean,
    default: true
  },
  questions: [questionSchema],
  
  // --- ADDED SOLANA FIELDS ---
  reward: { type: Number, default: 0 },         // SOL amount
  escrowAddress: { type: String, default: null }, // The PDA Public Key
  txHash: { type: String, default: null },        // Transaction Signature
  taskHash: { type: String, default: null },      // Seed used for PDA
  organiserWallet: { type: String, default: null } // Admin's Solana address
  // ---------------------------

}, { timestamps: true });

export default mongoose.model("Form", formSchema);