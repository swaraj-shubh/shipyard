import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import userRoutes from "./routes/userAuth.routes.js";
import adminRoutes from "./routes/adminAuth.routes.js";
import formRoutes from "./routes/form.routes.js";
import formResponseRoutes from "./routes/formResponse.routes.js";
import taskRoutes from "./routes/task.routes.js";
import blockchainRoutes from "./routes/blockchain.routes.js";

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

app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/forms", formRoutes);
app.use("/api/form-responses", formResponseRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/blockchain", blockchainRoutes);

// Default route
app.get("/", (req, res) => {
  res.send("🚀 Backend running successfully!");
});

app.listen(PORT, () => console.log(`🔥 Server running on port http://localhost:${PORT}`));
