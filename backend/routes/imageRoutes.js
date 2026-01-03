import express from "express";
import { uploadMiddleware, uploadImage, getImages } from "../controllers/imageController.js";

const router = express.Router();

router.post("/upload", uploadMiddleware, uploadImage);
router.get("/", getImages);

export default router;
