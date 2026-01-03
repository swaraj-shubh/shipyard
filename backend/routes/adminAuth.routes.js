// routes/adminAuth.routes.js
import express from "express";
import { adminLogin, adminRegister } from "../controllers/adminAuth.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { restrictTo } from "../middleware/role.middleware.js";

const router = express.Router();

router.post("/login", adminLogin);
router.get("/dashboard", protect, restrictTo("admin"), (req, res) => {
  res.json({ message: "Welcome Admin" });
});

// 🔒 Super admin only
router.post(
  "/register",
  protect,
  restrictTo("admin"),
  adminRegister
);

export default router;
