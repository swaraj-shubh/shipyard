// routes/adminAuth.routes.js
import express from "express";
import {
  adminLogin,
  adminSelfRegister,
} from "../controllers/adminAuth.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { restrictTo } from "../middleware/role.middleware.js";

const router = express.Router();

/**
 * Admin login
 */
router.post("/login", adminLogin);

/**
 * Admin dashboard (protected)
 */
router.get(
  "/dashboard",
  protect,
  restrictTo("admin"),
  (req, res) => {
    res.json({ message: "Welcome Admin" });
  }
);

/**
 * ✅ Public admin self-registration
 * Anyone can create a normal admin
 */
router.post("/register", adminSelfRegister);



export default router;
