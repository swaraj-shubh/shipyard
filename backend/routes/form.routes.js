import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { restrictTo } from "../middleware/role.middleware.js";
import {
  createForm,
  getAllForms,
  getFormById,
  getFormsByAdmin,
} from "../controllers/form.controller.js";

const router = express.Router();

router.get("/", getAllForms);
router.get("/:formId", getFormById);

// Admin
router.post("/", protect, restrictTo("admin"), createForm);
router.get("/admin/mine", protect, restrictTo("admin"), getFormsByAdmin);

export default router;
