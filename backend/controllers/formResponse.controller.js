// controllers/formResponse.controller.js
import Form from "../models/Form.js";
import FormResponse from "../models/FormResponse.js";

export const submitForm = async (req, res) => {
  try {
    const { answers } = req.body;
    const { formId } = req.params;

    const form = await Form.findById(formId);
    if (!form || !form.isActive) {
      return res.status(404).json({ message: "Form not found" });
    }

    // Prevent duplicate submission
    const alreadySubmitted = await FormResponse.findOne({
      formId,
      userId: req.user.id,
    });

    if (alreadySubmitted) {
      return res.status(409).json({ message: "Form already submitted" });
    }

    const response = await FormResponse.create({
      formId,
      userId: req.user.id,
      answers,
    });

    res.status(201).json({ message: "Form submitted successfully", response });
  } catch (err) {
    console.error("Submit form error:", err);
    res.status(500).json({ message: "Failed to submit form" });
  }
};

export const getMySubmissions = async (req, res) => {
  try {
    const responses = await FormResponse.find({
      userId: req.user.id,
    }).populate("formId", "title type");

    res.json(responses);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch submissions" });
  }
};

export const getFormResponses = async (req, res) => {
  try {
    const { formId } = req.params;

    const responses = await FormResponse.find({ formId })
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    res.json(responses);
  } catch (err) {
    console.error("Fetch responses error:", err);
    res.status(500).json({ message: "Failed to fetch responses" });
  }
};
