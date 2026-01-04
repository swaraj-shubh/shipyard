// routes/adminAuth.routes.js
import express from "express";
import {
  adminSelfRegister,
  adminRegister,
  adminRequestNonce,
  adminVerifySignature,
  getAdminMe,
} from "../controllers/adminAuth.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { restrictTo } from "../middleware/role.middleware.js";

const router = express.Router();

// 🔐 Wallet-based admin auth
router.post("/register", adminRegister);
router.post("/login/request-nonce", adminRequestNonce);
router.post("/login/verify", adminVerifySignature);

// 👤 Admin profile
router.get("/me", protect, restrictTo("admin"), getAdminMe);

// 📊 Admin dashboard
router.get("/dashboard", protect, restrictTo("admin"), (req, res) => {
  res.json({ message: "Welcome Admin" });
});


/**
 * ✅ Public admin self-registration
 * Anyone can create a normal admin
 */
router.post("/register", adminSelfRegister);



export default router;
