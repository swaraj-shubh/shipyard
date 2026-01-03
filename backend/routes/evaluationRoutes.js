import express from "express";
import {
  evaluateSubmission,
  getEvaluationResults,
  getEvaluationBySubmissionId,
  getEvaluationsByExam,
} from "../controllers/evaluationController.js";

const router = express.Router();

// Evaluate a specific submission
router.post("/:submissionId/evaluate", evaluateSubmission);

// Get all evaluation results
router.get("/", getEvaluationResults);

// Get evaluation by submission ID
router.get("/submission/:submissionId", getEvaluationBySubmissionId);

// Get evaluations by exam name
router.get("/exam/:examName", getEvaluationsByExam);

export default router;