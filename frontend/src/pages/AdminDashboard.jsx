import { useEffect, useState } from "react";
import axios from "axios";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectItem, SelectTrigger, SelectValue, SelectContent } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const API_BASE = import.meta.env.VITE_BACKEND_API || "http://localhost:5000/api";

const QUESTION_TYPES = [
  "text",
  "email",
  "number",
  "textarea",
  "select",
  "checkbox",
  "radio",
];

export default function AdminDashboard() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    type: "",
    description: "",
    questions: [],
  });

  // ================= FETCH ADMIN FORMS =================
  const fetchForms = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      console.log("Using token:", token);
      const res = await axios.get(`${API_BASE}/forms/admin/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setForms(res.data);
    } catch (err) {
      alert("Failed to fetch forms");
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  // ================= QUESTION HANDLERS =================
  const addQuestion = () => {
    setFormData({
      ...formData,
      questions: [
        ...formData.questions,
        {
          label: "",
          type: "text",
          required: false,
          options: [],
        },
      ],
    });
  };

  const updateQuestion = (index, field, value) => {
    const updated = [...formData.questions];
    updated[index][field] = value;
    setFormData({ ...formData, questions: updated });
  };

  const addOption = (qIndex) => {
    const updated = [...formData.questions];
    updated[qIndex].options.push("");
    setFormData({ ...formData, questions: updated });
  };

  const updateOption = (qIndex, oIndex, value) => {
    const updated = [...formData.questions];
    updated[qIndex].options[oIndex] = value;
    setFormData({ ...formData, questions: updated });
  };

  // ================= CREATE FORM =================
  const handleCreateForm = async () => {
    if (!formData.title || !formData.type || !formData.questions.length) {
      alert("Title, type, and at least one question required");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");

      await axios.post(`${API_BASE}/forms`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("Form created successfully");
      setFormData({ title: "", type: "", description: "", questions: [] });
      fetchForms();
    } catch (err) {
      alert(err.response?.data?.message || "Form creation failed");
    } finally {
      setLoading(false);
    }
  };

  // ================= UI =================
  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      {/* CREATE FORM */}
      <Card className="bg-slate-900 border border-slate-700">
        <CardHeader>
          <CardTitle>Create New Task / Form</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />
          </div>

          <div>
            <Label>Type</Label>
            <Select
              onValueChange={(val) =>
                setFormData({ ...formData, type: val })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="internship">Internship</SelectItem>
                <SelectItem value="hackathon">Hackathon</SelectItem>
                <SelectItem value="job">Job</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          {/* QUESTIONS */}
          <div className="space-y-4">
            <Label>Questions</Label>

            {formData.questions.map((q, index) => (
              <Card key={index} className="bg-slate-800 p-4 space-y-2">
                <Input
                  placeholder="Question label"
                  value={q.label}
                  onChange={(e) =>
                    updateQuestion(index, "label", e.target.value)
                  }
                />

                <Select
                  value={q.type}
                  onValueChange={(val) =>
                    updateQuestion(index, "type", val)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {QUESTION_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <label className="flex gap-2 items-center">
                  <input
                    type="checkbox"
                    checked={q.required}
                    onChange={(e) =>
                      updateQuestion(index, "required", e.target.checked)
                    }
                  />
                  Required
                </label>

                {(q.type === "select" ||
                  q.type === "checkbox" ||
                  q.type === "radio") && (
                  <div className="space-y-2">
                    {q.options.map((opt, i) => (
                      <Input
                        key={i}
                        placeholder={`Option ${i + 1}`}
                        value={opt}
                        onChange={(e) =>
                          updateOption(index, i, e.target.value)
                        }
                      />
                    ))}
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => addOption(index)}
                    >
                      Add Option
                    </Button>
                  </div>
                )}
              </Card>
            ))}

            <Button variant="secondary" onClick={addQuestion}>
              + Add Question
            </Button>
          </div>

          <Button
            className="w-full bg-indigo-600"
            onClick={handleCreateForm}
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Form"}
          </Button>
        </CardContent>
      </Card>

      {/* MY FORMS */}
      <Card className="bg-slate-900 border border-slate-700">
        <CardHeader>
          <CardTitle>My Created Forms</CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          {forms.length === 0 && (
            <p className="text-slate-400">No forms created yet</p>
          )}

          {forms.map((f) => (
            <div
              key={f._id}
              className="p-3 border border-slate-700 rounded"
            >
              <p className="font-semibold">{f.title}</p>
              <p className="text-sm text-slate-400">{f.type}</p>
              <p className="text-xs text-slate-500">
                Questions: {f.questions.length}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
