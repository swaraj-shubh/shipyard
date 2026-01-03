import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import imageRoutes from "./routes/imageRoutes.js";
import submissionRoutes from "./routes/submissionRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import evaluationRoutes from "./routes/evaluationRoutes.js";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 5000;

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ DB Connection Error:", err));

// Routes
app.use("/api/images", imageRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/evaluations", evaluationRoutes); 

// Default route
app.get("/", (req, res) => {
  res.send("🚀 Backend running successfully!");
});

app.listen(PORT, () => console.log(`🔥 Server running on port http://localhost:${PORT}`));
