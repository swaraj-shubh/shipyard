import mongoose from "mongoose";

const submissionSchema = new mongoose.Schema({
  examName: {
    type: String,
    required: true,
  },
  studentAnswerSheet: {
    type: String,
    required: true,
  },
  questionPaper: {
    type: String,
    required: true,
  },
  answerKey: {
    type: String,
    required: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("Submission", submissionSchema);
