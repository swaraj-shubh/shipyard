// routes/userAuth.routes.js
import express from "express";
import { userRegister, userLogin } from "../controllers/userAuth.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", userRegister);
router.post("/login", userLogin);
router.get("/me", protect, (req, res) => res.json(req.user));

export default router;


