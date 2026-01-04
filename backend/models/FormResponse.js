// models/FormResponse.js
import mongoose from "mongoose";

const answerSchema = new mongoose.Schema({
  questionId: {
    type: String,
    required: true,
  },
  value: mongoose.Schema.Types.Mixed,
});

const verificationSchema = new mongoose.Schema(
  {
    netScore: {
      type: Number,
      required: true,
    },
    passed: {
      type: Boolean,
      required: true,
    },
  },
  { _id: false }
);

const formResponseSchema = new mongoose.Schema(
  {
    formId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Form",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    answers: {
      type: [answerSchema],
      required: true,
    },
    verification: verificationSchema, // ✅ FIX
  },
  { timestamps: true }
);

export default mongoose.model("FormResponse", formResponseSchema);
