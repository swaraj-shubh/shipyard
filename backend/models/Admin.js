// models/Admin.js
import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true  
  },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true
  },
  password: { 
    type: String, 
    required: true
  },
  superAdmin: { 
    type: Boolean, 
    default: false
  },
}, { timestamps: true });

export default mongoose.model("Admin", adminSchema);
