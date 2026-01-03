import express from "express";
import {
  uploadFields,
  uploadSubmission,
  getSubmissions,
} from "../controllers/submissionController.js";

const router = express.Router();

router.post("/upload", uploadFields, uploadSubmission);
router.get("/", getSubmissions);

export default router;
