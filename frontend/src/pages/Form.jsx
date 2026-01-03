import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

// TensorFlow Imports
import * as tf from "@tensorflow/tfjs";
import * as blazeface from "@tensorflow-models/blazeface";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const API_BASE = import.meta.env.VITE_BACKEND_API;

export default function Form() {
  const { formId } = useParams();
  const navigate = useNavigate();

  // --- Core Form State ---
  const [form, setForm] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);

  // --- AI Compliance State ---
  const [model, setModel] = useState(null);
  const [stats, setStats] = useState({ total: 0, human: 0, bot: 0 });
  const [botFlag, setBotFlag] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const videoRef = useRef(null);

  // 1. Initialize AI and Camera with "Warm-up"
  useEffect(() => {
    const initAI = async () => {
      try {
        const loadedModel = await blazeface.load();
        setModel(loadedModel);

        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: 640, height: 480 } 
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          
          // Wait for video to be ready to prevent "Absent" results on start
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
          };

          // Warm-up the model (runs a few dummy predictions to prime GPU)
          setTimeout(async () => {
             await loadedModel.estimateFaces(videoRef.current, false);
          }, 2000);
        }
      } catch (err) {
        console.error("AI/Camera Init failed:", err);
      }
    };
    initAI();

    const handleMouse = (e) => {
      if (e.isTrusted === false) setBotFlag(true);
    };
    window.addEventListener("mousemove", handleMouse);

    return () => {
      window.removeEventListener("mousemove", handleMouse);
      // Cleanup tracks on unmount
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // 2. The 10-second Verification Loop
  useEffect(() => {
    if (!model || !form) return;

    const interval = setInterval(async () => {
      // Ensure video is ready and playing
      if (!videoRef.current || videoRef.current.readyState < 2) return;

      const predictions = await model.estimateFaces(videoRef.current, false);
      
      // Lowered probability threshold slightly to 0.85 for more reliable detection
      const isHuman = predictions.length > 0 && predictions[0].probability[0] > 0.85;

      setStats((prev) => ({
        total: prev.total + 1,
        human: isHuman && !botFlag ? prev.human + 1 : prev.human,
        bot: !isHuman || botFlag ? prev.bot + 1 : prev.bot,
      }));

      setBotFlag(false); 
    }, 10000);

    return () => clearInterval(interval);
  }, [model, form, botFlag]);

  // 3. Fetch Form Data
  useEffect(() => {
    const fetchForm = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE}/forms/${formId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setForm(res.data);
      } catch (err) {
        console.error("Form load error");
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
    if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    }
    setShowReport(true);
  };

  const finalizeSubmission = async () => {
    try {
      const token = localStorage.getItem("token");
      const formattedAnswers = Object.entries(answers).map(([questionId, value]) => ({
        questionId,
        value,
      }));

      await axios.post(
        `${API_BASE}/form-responses/${formId}/submit`,
        { 
          answers: formattedAnswers,
          complianceScore: Math.round((stats.human / stats.total) * 100) 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Form submitted successfully");
      navigate("/dashboard");
    } catch (err) {
      alert(err.response?.data?.message || "Submission failed");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-white">Loading form...</div>;
  if (!form) return null;

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center p-6 relative">
      
      {/* CAMERA PREVIEW - BOTTOM LEFT */}
      <div className="fixed bottom-6 left-6 z-50">
        <video 
            ref={videoRef} 
            autoPlay 
            muted 
            playsInline 
            className="w-40 h-32 rounded-xl border-2 border-green-500 shadow-2xl object-cover scale-x-[-1] bg-black"
        />
        <div className="absolute top-2 left-2 bg-green-500 text-[10px] font-bold px-2 py-0.5 rounded text-black uppercase">
            Live Feed
        </div>
      </div>

      {/* LIVE COMPLIANCE BAR */}
      <div className="w-full max-w-2xl mb-4 flex justify-between text-xs font-mono bg-slate-800 p-2 rounded border border-slate-700">
        <span className="text-green-400">HUMAN VERIFIED: {stats.human}</span>
        <span className="text-slate-400">TOTAL INTERVALS: {stats.total}</span>
        <span className="text-red-400">BOT/ABSENT: {stats.bot}</span>
      </div>

      <Card className="w-full max-w-2xl bg-slate-900 border border-slate-700 mb-20">
        <CardHeader>
          <CardTitle className="text-2xl">{form.title}</CardTitle>
          <p className="text-slate-400">{form.description}</p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {form.questions.map((q) => (
              <div key={q._id} className="space-y-1">
                <Label>{q.label} {q.required && "*"}</Label>

                {q.type === "text" && (
                  <Input onChange={(e) => handleChange(q._id, e.target.value)} required={q.required} className="bg-slate-800 border-slate-700" />
                )}

                {q.type === "email" && (
                  <Input type="email" onChange={(e) => handleChange(q._id, e.target.value)} required={q.required} className="bg-slate-800 border-slate-700" />
                )}

                {q.type === "number" && (
                  <Input type="number" onChange={(e) => handleChange(q._id, e.target.value)} required={q.required} className="bg-slate-800 border-slate-700" />
                )}

                {q.type === "textarea" && (
                  <Textarea onChange={(e) => handleChange(q._id, e.target.value)} required={q.required} className="bg-slate-800 border-slate-700" />
                )}

                {(q.type === "select" || q.type === "radio") && (
                  <select
                    className="w-full bg-slate-800 border border-slate-700 p-2 rounded text-white"
                    onChange={(e) => handleChange(q._id, e.target.value)}
                    required={q.required}
                  >
                    <option value="">Select</option>
                    {q.options.map((opt, i) => (
                      <option key={i} value={opt}>{opt}</option>
                    ))}
                  </select>
                )}

                {q.type === "checkbox" && (
                  <div className="space-y-1">
                    {q.options.map((opt, i) => (
                      <label key={i} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          value={opt}
                          className="w-4 h-4 rounded border-slate-700 bg-slate-800"
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
                        <span className="text-sm text-slate-300">{opt}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <Button className="w-full bg-green-600 hover:bg-green-500 py-6 text-lg font-bold">
              Submit Form
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* REPORT MODAL */}
      {showReport && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 p-10 rounded-3xl max-w-md w-full text-center shadow-2xl">
            <h2 className="text-slate-500 uppercase tracking-[0.2em] text-xs font-bold mb-2">Security Audit Complete</h2>
            <div className={`text-7xl font-black my-6 ${ (stats.human / stats.total) < 0.6 ? 'text-red-500' : 'text-green-500'}`}>
              {stats.total > 0 ? Math.round((stats.human / stats.total) * 100) : 0}%
            </div>
            <p className="text-slate-300 text-lg font-medium mb-8">Human Integrity Score</p>
            
            <div className="grid grid-cols-2 gap-4 mb-10">
                <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
                    <span className="text-slate-500 text-[10px] uppercase block mb-1">Verified</span>
                    <span className="text-green-400 font-bold text-xl">{stats.human}</span>
                </div>
                <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
                    <span className="text-slate-500 text-[10px] uppercase block mb-1">Unverified</span>
                    <span className="text-red-400 font-bold text-xl">{stats.bot}</span>
                </div>
            </div>

            <Button onClick={finalizeSubmission} className="w-full bg-green-600 hover:bg-green-500 py-7 text-xl font-black rounded-2xl shadow-lg shadow-green-900/20">
                FINALIZE SUBMISSION
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}