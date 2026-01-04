import Form from "../models/Form.js";

export const createForm = async (req, res) => {
  try {
    // 1. Destructure the new Solana fields from the request body
    const { 
      title, 
      type, 
      description, 
      questions, 
      reward, 
      escrowAddress, 
      txHash, 
      taskHash, 
      organiser 
    } = req.body;

    if (!title || !type || !questions || !questions.length) {
      return res.status(400).json({ message: "Invalid form data" });
    }

    // 2. Create the form with blockchain metadata
    const form = await Form.create({
      title,
      type,
      description,
      questions,
      createdBy: req.user.id,
      reward: reward || 0,
      escrowAddress: escrowAddress || null,
      txHash: txHash || null,
      taskHash: taskHash || null,
      organiserWallet: organiser || null
    });

    res.status(201).json(form);
  } catch (err) {
    console.error("Create form error:", err);
    res.status(500).json({ message: "Failed to create form" });
  }
};

// Update getAllForms to include reward info so users know it's a paid task
export const getAllForms = async (req, res) => {
  try {
    const forms = await Form.find({ isActive: true })
      .select("title type description reward escrowAddress createdAt");

    res.json(forms);
  } catch (err) {
    console.error("Get forms error:", err);
    res.status(500).json({ message: "Failed to fetch forms" });
  }
};

// ... keep other functions (getFormById, updateForm, etc.) as they are

export const getFormById = async (req, res) => {
  try {
    const form = await Form.findById(req.params.formId);

    if (!form || !form.isActive) {
      return res.status(404).json({ message: "Form not found" });
    }

    res.json(form);
  } catch (err) {
    console.error("Get form error:", err);
    res.status(500).json({ message: "Failed to fetch form" });
  }
};

export const getFormsByAdmin = async (req, res) => {
  try {
    const forms = await Form.find({ createdBy: req.user.id });
    res.json(forms);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch admin forms" });
  }
};


// (optional)
export const deactivateForm = async (req, res) => {
  try {
    const form = await Form.findById(req.params.formId);

    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }

    if (form.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    form.isActive = false;
    await form.save();

    res.json({ message: "Form deactivated" });
  } catch (err) {
    console.error("Deactivate form error:", err);
    res.status(500).json({ message: "Failed to deactivate form" });
  }
};

export const deleteForm = async (req, res) => {
  try {
    const form = await Form.findById(req.params.formId);

    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }

    if (form.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await form.remove();

    res.json({ message: "Form deleted" });
  } catch (err) {
    console.error("Delete form error:", err);
    res.status(500).json({ message: "Failed to delete form" });
  }
};

export const updateForm = async (req, res) => {
  try {
    const form = await Form.findById(req.params.formId);

    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }

    if (form.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const { title, type, description, questions } = req.body;

    if (title) form.title = title;
    if (type) form.type = type;
    if (description) form.description = description;
    if (questions && questions.length) form.questions = questions;

    await form.save();

    res.json(form);
  } catch (err) {
    console.error("Update form error:", err);
    res.status(500).json({ message: "Failed to update form" });
  }
};  

