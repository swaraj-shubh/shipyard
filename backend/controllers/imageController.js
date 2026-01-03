import cloudinary from "../cloudinary/cloudinaryConfig.js";
import Image from "../models/Image.js";
import multer from "multer";
import fs from "fs";

// Multer setup for temporary file storage
const upload = multer({ dest: "uploads/" });

export const uploadMiddleware = upload.single("image");

// Upload image to Cloudinary and MongoDB
export const uploadImage = async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "uploads",
    });

    const newImage = new Image({ url: result.secure_url });
    await newImage.save();

    fs.unlinkSync(req.file.path); // remove local file

    res.status(200).json({ message: "Image uploaded successfully", image: newImage });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Upload failed", error });
  }
};

// Fetch all uploaded images
export const getImages = async (req, res) => {
  try {
    const images = await Image.find().sort({ uploadedAt: -1 });
    res.status(200).json(images);
  } catch (error) {
    res.status(500).json({ message: "Error fetching images", error });
  }
};
