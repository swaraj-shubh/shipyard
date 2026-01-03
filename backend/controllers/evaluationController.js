import EvaluationResult from "../models/EvaluationResult.js";
import Submission from "../models/Submission.js";
import axios from "axios";
import FormData from "form-data";
import fs from "fs";

// Helper function to download image from Cloudinary to temp file
const downloadImage = async (imageUrl, filePath) => {
  try {
    const response = await axios({
      method: 'GET',
      url: imageUrl,
      responseType: 'stream',
    });

    return new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  } catch (error) {
    throw new Error(`Failed to download image: ${error.message}`);
  }
};

// Extract template from question paper (you might need to adjust this logic)
const extractTemplate = async (questionPaperUrl, templatePath) => {
  // For now, we'll use the question paper as template
  // In a real scenario, you might have a separate template or process to extract it
  await downloadImage(questionPaperUrl, templatePath);
  return templatePath;
};

// Main evaluation function
export const evaluateSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;

    // Find the submission
    const submission = await Submission.findById(submissionId);
    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    // Create temporary file paths
    const tempDir = "temp_uploads";
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const templatePath = `${tempDir}/template_${submissionId}.jpg`;
    const teacherSheetPath = `${tempDir}/teacher_${submissionId}.jpg`;
    const studentSheetPath = `${tempDir}/student_${submissionId}.jpg`;

    try {
      // Download images to temporary files
      await extractTemplate(submission.questionPaper, templatePath);
      await downloadImage(submission.answerKey, teacherSheetPath);
      await downloadImage(submission.studentAnswerSheet, studentSheetPath);

      // Prepare form data for FastAPI
      const formData = new FormData();
      formData.append("template", fs.createReadStream(templatePath));
      formData.append("teacher_sheet", fs.createReadStream(teacherSheetPath));
      formData.append("student_sheet", fs.createReadStream(studentSheetPath));

      // Send to FastAPI for evaluation
      const fastApiResponse = await axios.post(
        "http://localhost:8000/api/v1/evaluate",
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
          timeout: 300000, // 5 minutes timeout
        }
      );

      // Parse the evaluation result
      const evaluationData = fastApiResponse.data;

      // Extract structured data
      const rawResult = evaluationData.result?.raw;
      let jsonResult = null;

      // Try to extract JSON from markdown code block
      if (rawResult && rawResult.includes('```json')) {
        const jsonMatch = rawResult.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch && jsonMatch[1]) {
          try {
            jsonResult = JSON.parse(jsonMatch[1]);
          } catch (parseError) {
            console.error("Error parsing JSON from raw result:", parseError);
          }
        }
      }

      // If no JSON found in markdown, try to parse the entire raw result
      if (!jsonResult) {
        try {
          jsonResult = JSON.parse(rawResult);
        } catch (parseError) {
          console.error("Error parsing raw result as JSON:", parseError);
          jsonResult = { raw: rawResult };
        }
      }

      // Extract insights from tasks output
      const tasksOutput = evaluationData.result?.tasks_output || [];
      const insightsTask = tasksOutput.find(task => 
        task.agent === "Academic Performance Analyst" && 
        task.raw && 
        typeof task.raw === 'object'
      );

      const insights = insightsTask?.raw || {};

      // Create evaluation result document
      const evaluationResult = new EvaluationResult({
        submissionId: submission._id,
        examName: submission.examName,
        evaluationData: evaluationData,
        summary: {
          total_questions: insights.total_questions,
          correct_answers: insights.correct_answers,
          wrong_answers: insights.wrong_answers,
          unanswered: insights.unanswered,
          accuracy_percent: insights.score_percentage,
          score_percentage: insights.score_percentage
        },
        insights: {
          overall_performance: insights.overall_performance,
          strengths: insights.strengths || [],
          areas_for_improvement: insights.areas_for_improvement || [],
          motivational_feedback: insights.motivational_feedback
        },
        pipeline_review: jsonResult?.pipeline_review || {},
        manual_review_needed: jsonResult?.manual_review_needed || false
      });

      await evaluationResult.save();

      // Clean up temporary files
      try {
        fs.unlinkSync(templatePath);
        fs.unlinkSync(teacherSheetPath);
        fs.unlinkSync(studentSheetPath);
      } catch (cleanupError) {
        console.error("Error cleaning up temp files:", cleanupError);
      }

      res.status(200).json({
        message: "Evaluation completed successfully",
        evaluationResult,
      });

    } catch (fileError) {
      // Clean up temporary files on error
      try {
        if (fs.existsSync(templatePath)) fs.unlinkSync(templatePath);
        if (fs.existsSync(teacherSheetPath)) fs.unlinkSync(teacherSheetPath);
        if (fs.existsSync(studentSheetPath)) fs.unlinkSync(studentSheetPath);
      } catch (cleanupError) {
        console.error("Error cleaning up temp files:", cleanupError);
      }
      throw fileError;
    }

  } catch (error) {
    console.error("Evaluation Error:", error);
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        message: "Evaluation service is unavailable", 
        error: "FastAPI server not running on localhost:8000" 
      });
    }
    
    if (error.response) {
      return res.status(error.response.status).json({ 
        message: "Evaluation service error", 
        error: error.response.data 
      });
    }

    res.status(500).json({ 
      message: "Evaluation failed", 
      error: error.message 
    });
  }
};

// Get all evaluation results
export const getEvaluationResults = async (req, res) => {
  try {
    const evaluations = await EvaluationResult.find()
      .populate("submissionId")
      .sort({ evaluatedAt: -1 });
    res.status(200).json(evaluations);
  } catch (error) {
    res.status(500).json({ message: "Error fetching evaluations", error });
  }
};

// Get evaluation results by submission ID
export const getEvaluationBySubmissionId = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const evaluation = await EvaluationResult.findOne({ submissionId })
      .populate("submissionId");

    if (!evaluation) {
      return res.status(404).json({ message: "Evaluation not found" });
    }

    res.status(200).json(evaluation);
  } catch (error) {
    res.status(500).json({ message: "Error fetching evaluation", error });
  }
};

// Get evaluation results by exam name
export const getEvaluationsByExam = async (req, res) => {
  try {
    const { examName } = req.params;
    const evaluations = await EvaluationResult.find({ examName })
      .populate("submissionId")
      .sort({ evaluatedAt: -1 });

    res.status(200).json(evaluations);
  } catch (error) {
    res.status(500).json({ message: "Error fetching evaluations", error });
  }
};