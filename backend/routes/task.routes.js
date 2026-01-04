import express from "express";
import { createTask, getTaskByCid } from "../controllers/task.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * Admin creates task
 */
router.post("/create", protect, createTask);

/**
 * User fetches task using CID
 */
router.get("/:cid", getTaskByCid);

export default router;
