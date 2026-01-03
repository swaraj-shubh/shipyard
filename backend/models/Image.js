import mongoose from "mongoose";

const imageSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Image", imageSchema);
