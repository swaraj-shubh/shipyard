import express from "express";
import {
  createTask,
  submitProof,
} from "../controllers/blockchain.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/task/create", protect, createTask);
router.post("/task/submit-proof", protect, submitProof);

export default router;