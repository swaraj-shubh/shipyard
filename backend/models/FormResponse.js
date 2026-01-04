// models/FormResponse.js
import mongoose from "mongoose";

const answerSchema = new mongoose.Schema({
  questionId: String,
  value: mongoose.Schema.Types.Mixed
});

const formResponseSchema = new mongoose.Schema({
  formId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Form"
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  answers: [answerSchema]
}, { timestamps: true });

export default mongoose.model("FormResponse", formResponseSchema);
