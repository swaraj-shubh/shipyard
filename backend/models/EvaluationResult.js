import mongoose from "mongoose";

const evaluationResultSchema = new mongoose.Schema({
  submissionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Submission",
    required: true,
  },
  examName: {
    type: String,
    required: true,
  },
  evaluationData: {
    type: Object,
    required: true,
  },
  summary: {
    total_questions: Number,
    correct_answers: Number,
    wrong_answers: Number,
    unanswered: Number,
    accuracy_percent: String,
    score_percentage: String
  },
  insights: {
    overall_performance: String,
    strengths: [String],
    areas_for_improvement: [String],
    motivational_feedback: String
  },
  pipeline_review: {
    evaluation_pipeline_status: String,
    alignment_status: String,
    ocr_quality: Object,
    evaluation_results_validation: Object
  },
  manual_review_needed: Boolean,
  evaluatedAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("EvaluationResult", evaluationResultSchema);