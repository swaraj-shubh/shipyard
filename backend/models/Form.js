// models/Form.js
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
  questions: [questionSchema]
}, { timestamps: true });

export default mongoose.model("Form", formSchema);
