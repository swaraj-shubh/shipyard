import { useEffect, useState, useRef, useCallback } from "react";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AlertCircle, Shield, Camera, Activity, Loader2 } from "lucide-react";

/* -------------------------------------------------------------------------- */
/* CONFIG */
/* -------------------------------------------------------------------------- */

const API_BASE_URL =
  import.meta.env.VITE_BACKEND_API || "http://localhost:5000/api";

const THRESHOLDS = {
  MIN_MOUSE_VELOCITY: 5,
  MAX_MOUSE_VELOCITY: 2000,
  MIN_MOUSE_MOVES_PER_CHECK: 8,
  MAX_MOUSE_MOVES_PER_CHECK: 200,
  MIN_CHECKS_REQUIRED: 5,
  FACE_CONFIDENCE_THRESHOLD: 0.85,
  CHECK_INTERVAL: 6000,
};

const MIN_NET_SCORE = 70;

/* -------------------------------------------------------------------------- */
/* COMPONENT */
/* -------------------------------------------------------------------------- */

export default function DynamicForm() {
  /* ----------------------------- HELPERS ----------------------------- */

  const handleChange = (id, value) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const getScoreColor = (score) => {
    if (score >= 85) return "text-green-500";
    if (score >= 70) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreLabel = (score) => {
    if (score >= 90) return "Exceptional";
    if (score >= 80) return "Trusted";
    if (score >= 70) return "Verified";
    return "Suspicious";
  };

  const getFormId = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get("formId") || window.location.pathname.split("/").pop();
  };

  const formId = getFormId();

  /* ----------------------------- STATE ----------------------------- */

  const [form, setForm] = useState(null);
  const [formLoading, setFormLoading] = useState(true);
  const [formError, setFormError] = useState(null);
  const [answers, setAnswers] = useState({});
  const [showReport, setShowReport] = useState(false);
  const [securityReady, setSecurityReady] = useState(false);
  const [initError, setInitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [liveStats, setLiveStats] = useState({
    checks: 0,
    faceDetectionRate: 0,
    avgMouseActivity: 0,
    overallScore: 100,
    sessionDuration: 0,
  });

  /* ----------------------------- REFS ----------------------------- */

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const modelRef = useRef(null);
  const timeoutRef = useRef(null);
  const startTimeRef = useRef(Date.now());
  const surveillanceRef = useRef({ running: false });

  const intervalDataRef = useRef({
    mouseMoves: 0,
    mousePositions: [],
    suspiciousEvents: 0,
    lastMouseTime: Date.now(),
  });

  const metricsRef = useRef({
    faceDetections: [],
    mouseVelocities: [],
    behaviorScores: [],
  });

  /* -------------------------------------------------------------------------- */
  /* FETCH FORM */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/forms/${formId}`);
        if (!res.ok) throw new Error("Form not found");
        const data = await res.json();
        if (!data.isActive) throw new Error("Form inactive");
        setForm(data);
      } catch (e) {
        setFormError(e.message);
      } finally {
        setFormLoading(false);
      }
    };

    if (formId) fetchForm();
  }, [formId]);

  /* -------------------------------------------------------------------------- */
  /* SCORING */
  /* -------------------------------------------------------------------------- */

  const calculateScore = useCallback(() => {
    const m = metricsRef.current;
    if (!m.faceDetections.length) return 0;

    const faceScore =
      m.faceDetections.reduce(
        (s, f) => s + (f.present ? f.confidence : 0),
        0
      ) / m.faceDetections.length;

    const mouseAvg =
      m.mouseVelocities.reduce((a, b) => a + b, 0) /
      (m.mouseVelocities.length || 1);

    const mouseScore =
      mouseAvg < THRESHOLDS.MIN_MOUSE_VELOCITY
        ? 0.3
        : mouseAvg > THRESHOLDS.MAX_MOUSE_VELOCITY
        ? 0.2
        : 1;

    return Math.round((faceScore * 0.6 + mouseScore * 0.4) * 100);
  }, []);

  const getNetScore = () => calculateScore();

  /* -------------------------------------------------------------------------- */
  /* SURVEILLANCE */
  /* -------------------------------------------------------------------------- */

  const runCheck = useCallback(async () => {
    if (!surveillanceRef.current.running) return;

    let facePresent = false;
    let faceConfidence = 0;

    try {
      const predictions = await modelRef.current.estimateFaces(
        videoRef.current,
        false
      );
      if (predictions.length) {
        facePresent = true;
        faceConfidence = predictions[0].probability?.[0] || 0.9;
      }
    } catch {}

    const interval = intervalDataRef.current;

    if (Date.now() - interval.lastMouseTime > 4000) {
      interval.suspiciousEvents++;
    }

    let avgVelocity = 0;
    if (interval.mousePositions.length > 1) {
      const v = interval.mousePositions;
      avgVelocity =
        Math.hypot(v.at(-1).x - v[0].x, v.at(-1).y - v[0].y) /
        ((v.at(-1).time - v[0].time) / 1000);
    }

    metricsRef.current.faceDetections.push({
      present: facePresent,
      confidence: faceConfidence,
    });

    metricsRef.current.mouseVelocities.push(avgVelocity);

    setLiveStats((prev) => ({
      ...prev,
      checks: prev.checks + 1,
      faceDetectionRate: facePresent ? 100 : 0,
      avgMouseActivity: Math.round(avgVelocity),
      overallScore: calculateScore(),
      sessionDuration: Math.round(
        (Date.now() - startTimeRef.current) / 1000
      ),
    }));

    intervalDataRef.current = {
      mouseMoves: 0,
      mousePositions: [],
      suspiciousEvents: 0,
      lastMouseTime: Date.now(),
    };

    timeoutRef.current = setTimeout(runCheck, THRESHOLDS.CHECK_INTERVAL);
  }, [calculateScore]);

  /* -------------------------------------------------------------------------- */
  /* INIT CAMERA */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    if (!form) return;

    let stream;

    (async () => {
      try {
        await tf.setBackend("webgl");
        await tf.ready();
        const bf = await import("@tensorflow-models/blazeface");
        modelRef.current = await bf.load();

        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoRef.current.srcObject = stream;

        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          surveillanceRef.current.running = true;
          startTimeRef.current = Date.now();
          setSecurityReady(true);
          runCheck();
        };
      } catch (e) {
        setInitError(e.message);
      }
    })();

    const onMouse = (e) => {
      intervalDataRef.current.mousePositions.push({
        x: e.clientX,
        y: e.clientY,
        time: Date.now(),
      });
      intervalDataRef.current.lastMouseTime = Date.now();
    };

    window.addEventListener("mousemove", onMouse);

    return () => {
      surveillanceRef.current.running = false;
      clearTimeout(timeoutRef.current);
      window.removeEventListener("mousemove", onMouse);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [form, runCheck]);

  /* -------------------------------------------------------------------------- */
  /* SUBMIT */
  /* -------------------------------------------------------------------------- */

  const handleSubmit = (e) => {
    e.preventDefault();
    const netScore = getNetScore();

    if (liveStats.checks < THRESHOLDS.MIN_CHECKS_REQUIRED)
      return alert("Verification running");

    if (netScore < MIN_NET_SCORE)
      return alert("Score too low. Try again.");

    setShowReport(true);
  };

  const finalizeSubmission = async () => {
  setSubmitting(true);

  const netScore = getNetScore();

  const formattedAnswers = Object.entries(answers).map(
    ([questionId, value]) => ({
      questionId,
      value,
    })
  );

  try {
    const res = await fetch(
      `${API_BASE_URL}/form-responses/${formId}/submit`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          answers: formattedAnswers,
          verification: {
            netScore,
            passed: netScore >= MIN_NET_SCORE,
          },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || "Submission failed");
    }

    alert("Form submitted successfully");
  } catch (err) {
    console.error(err);
    alert(err.message);
  } finally {
    setSubmitting(false);
  }
};



  /* ---------------- UI (YOUR UI CONTINUES UNCHANGED BELOW) ---------------- */

  if (formLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-6 flex items-center justify-center">
        <div className="text-center">Loading form...</div>
      </div>
    );
  }

  if (formError) {
    return (
      <div className="min-h-screen bg-slate-900 text-white p-6 flex items-center justify-center">
        <div className="max-w-md bg-slate-800 p-6 rounded">{formError}</div>
      </div>
    );
  }






  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 relative">
      {/* Camera Feed */}
      <div className="fixed bottom-6 left-6 z-50">
        <div className="relative">
          <video
            ref={videoRef}
            muted
            playsInline
            autoPlay
            className={`w-52 h-40 rounded-xl object-cover scale-x-[-1] transition-all
              ${securityReady ? "border-2 border-green-500" : "border-2 border-slate-600 opacity-50"}`}
          />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-52 h-40 scale-x-[-1] pointer-events-none rounded-xl"
          />
          <div className="absolute top-2 right-2 bg-black/80 px-3 py-1 rounded-full flex items-center gap-2">
            {securityReady ? (
              <>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-xs font-semibold">MONITORING</span>
              </>
            ) : (
              <span className="text-xs">Initializing...</span>
            )}
          </div>
        </div>
      </div>

      {/* Security Dashboard */}
      <div className="max-w-2xl mx-auto mb-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <Shield className="w-6 h-6 mx-auto mb-2 text-blue-400" />
                <div className="text-2xl font-bold">{liveStats.checks}</div>
                <div className="text-xs text-slate-400">Security Checks</div>
              </div>
              <div className="text-center">
                <Camera className="w-6 h-6 mx-auto mb-2 text-green-400" />
                <div className="text-2xl font-bold">{liveStats.faceDetectionRate}%</div>
                <div className="text-xs text-slate-400">Face Detection</div>
              </div>
              <div className="text-center">
                <Activity className="w-6 h-6 mx-auto mb-2 text-purple-400" />
                <div className="text-2xl font-bold">{liveStats.avgMouseActivity}</div>
                <div className="text-xs text-slate-400">Mouse Activity</div>
              </div>
              <div className="text-center">
                <Shield className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
                <div className={`text-2xl font-bold ${getScoreColor(liveStats.overallScore)}`}>
                  {liveStats.overallScore}%
                </div>
                <div className="text-xs text-slate-400">Integrity Score</div>
              </div>
            </div>
            
            {liveStats.checks < THRESHOLDS.MIN_CHECKS_REQUIRED && (
              <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-xs text-yellow-400 text-center">
                  ⏳ Collecting security samples: {liveStats.checks}/{THRESHOLDS.MIN_CHECKS_REQUIRED}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Form */}
      <Card className="max-w-2xl mx-auto bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-2xl text-white">{form.title}</CardTitle>
          <p className="text-slate-400">{form.description}</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {form.questions.map((q) => (
              <div key={q.id} className="space-y-2">
                <Label className="text-white text-sm font-medium">
                  {q.label}
                  {q.required && <span className="text-red-400 ml-1">*</span>}
                </Label>
                {q.type === "text" && (
                  <Input
                    value={answers[q.id] || ""}
                    onChange={(e) => handleChange(q.id, e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                    required={q.required}
                  />
                )}
                {q.type === "textarea" && (
                  <Textarea
                    value={answers[q.id] || ""}
                    onChange={(e) => handleChange(q.id, e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white min-h-24"
                    required={q.required}
                  />
                )}
              </div>
            ))}
            <Button
              onClick={handleSubmit}
              disabled={!securityReady || liveStats.checks < THRESHOLDS.MIN_CHECKS_REQUIRED}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white font-semibold py-3"
            >
              {liveStats.checks < THRESHOLDS.MIN_CHECKS_REQUIRED
                ? `Verifying... (${liveStats.checks}/${THRESHOLDS.MIN_CHECKS_REQUIRED})`
                : "Submit Form"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Verification Report */}
      {showReport && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-6">
          <Card className="bg-slate-800 border-slate-700 max-w-lg w-full">
            <CardContent className="pt-10 pb-10">
              <div className="text-center mb-8">
                <div className={`text-8xl font-black mb-3 ${getScoreColor(liveStats.overallScore)}`}>
                  {liveStats.overallScore}%
                </div>
                <div className="text-2xl font-semibold text-white mb-2">
                  {getScoreLabel(liveStats.overallScore)}
                </div>
                <p className="text-slate-400">Biometric Integrity Score</p>
              </div>

              <div className="bg-slate-900 p-6 rounded-xl space-y-4 mb-8">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Total Security Checks</span>
                  <span className="text-white font-semibold">{liveStats.checks}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Face Detection Rate</span>
                  <span className="text-white font-semibold">{liveStats.faceDetectionRate}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Session Duration</span>
                  <span className="text-white font-semibold">{liveStats.sessionDuration}s</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Mouse Behavior</span>
                  <span className="text-white font-semibold">
                    {liveStats.avgMouseActivity > 0 ? "Normal" : "Low Activity"}
                  </span>
                </div>
              </div>

              <Button
                onClick={finalizeSubmission}
                disabled={submitting}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white font-semibold py-4 text-lg"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </span>
                ) : (
                  "Confirm & Submit"
                )}
              </Button>
              
              <p className="text-xs text-slate-500 text-center mt-4">
                Your biometric data is processed locally and not stored
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}