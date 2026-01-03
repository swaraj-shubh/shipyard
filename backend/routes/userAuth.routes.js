// routes/userAuth.routes.js
import express from "express";
import {
  userRegister,
  requestNonce,
  verifySignature,
  getMe,
} from "../controllers/userAuth.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", userRegister);
router.post("/login/request-nonce", requestNonce);
router.post("/login/verify", verifySignature);
router.get("/me", protect, getMe);

export default router;
