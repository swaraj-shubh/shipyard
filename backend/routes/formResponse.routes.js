import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { restrictTo } from "../middleware/role.middleware.js";
import {
  submitForm,
  getMySubmissions,
  getFormResponses,
} from "../controllers/formResponse.controller.js";

const router = express.Router();

router.post("/:formId/submit", protect, submitForm);
router.get("/me", protect, getMySubmissions);

// Admin
router.get("/:formId/responses", protect, restrictTo("admin"), getFormResponses);

export default router;
