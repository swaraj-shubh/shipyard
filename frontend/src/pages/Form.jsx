import { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const API_BASE = "http://localhost:5000/api";

export default function Form() {
  const { formId } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await axios.get(`${API_BASE}/forms/${formId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setForm(res.data);
      } catch (err) {
        // alert("Failed to load form");
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, [formId]);

  const handleChange = (qid, value) => {
    setAnswers({ ...answers, [qid]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");

      const formattedAnswers = Object.entries(answers).map(
        ([questionId, value]) => ({
          questionId,
          value,
        })
      );

      await axios.post(
        `${API_BASE}/form-responses/${formId}/submit`,
        { answers: formattedAnswers },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      alert("Form submitted successfully");
      navigate("/dashboard");
    } catch (err) {
      alert(err.response?.data?.message || "Submission failed");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading form...
      </div>
    );
  }

  if (!form) return null;

//   if(token==null){
//     return (
//         <div className="min-h-screen flex items-center justify-center text-white">
//             Please login to fill the form.
//         </div>
//     )
//   }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex justify-center p-6">
      <Card className="w-full max-w-2xl bg-slate-900 border border-slate-700">
        <CardHeader>
          <CardTitle className="text-2xl">{form.title}</CardTitle>
          <p className="text-slate-400">{form.description}</p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {form.questions.map((q) => (
              <div key={q._id} className="space-y-1">
                <Label>
                  {q.label} {q.required && "*"}
                </Label>

                {q.type === "text" && (
                  <Input
                    onChange={(e) =>
                      handleChange(q._id, e.target.value)
                    }
                    required={q.required}
                  />
                )}

                {q.type === "email" && (
                  <Input
                    type="email"
                    onChange={(e) =>
                      handleChange(q._id, e.target.value)
                    }
                    required={q.required}
                  />
                )}

                {q.type === "number" && (
                  <Input
                    type="number"
                    onChange={(e) =>
                      handleChange(q._id, e.target.value)
                    }
                    required={q.required}
                  />
                )}

                {q.type === "textarea" && (
                  <Textarea
                    onChange={(e) =>
                      handleChange(q._id, e.target.value)
                    }
                    required={q.required}
                  />
                )}

                {(q.type === "select" ||
                  q.type === "radio") && (
                  <select
                    className="w-full bg-slate-800 border border-slate-700 p-2 rounded"
                    onChange={(e) =>
                      handleChange(q._id, e.target.value)
                    }
                    required={q.required}
                  >
                    <option value="">Select</option>
                    {q.options.map((opt, i) => (
                      <option key={i} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                )}

                {q.type === "checkbox" && (
                  <div className="space-y-1">
                    {q.options.map((opt, i) => (
                      <label key={i} className="flex gap-2">
                        <input
                          type="checkbox"
                          value={opt}
                          onChange={(e) => {
                            const prev = answers[q._id] || [];
                            handleChange(
                              q._id,
                              e.target.checked
                                ? [...prev, opt]
                                : prev.filter((v) => v !== opt)
                            );
                          }}
                        />
                        {opt}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <Button className="w-full bg-green-600 hover:bg-green-500">
              Submit Form
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
