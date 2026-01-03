import { useEffect, useState, useRef, useCallback } from "react";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AlertCircle, Shield, Camera, Activity, Loader2 } from "lucide-react";

// Configuration
const API_BASE_URL = import.meta.env.VITE_BACKEND_API || "http://localhost:5000/api";

const THRESHOLDS = {
  MIN_MOUSE_VELOCITY: 5,
  MAX_MOUSE_VELOCITY: 2000,
  MIN_MOUSE_MOVES_PER_CHECK: 8,
  MAX_MOUSE_MOVES_PER_CHECK: 200,
  MIN_CHECKS_REQUIRED: 5,
  FACE_CONFIDENCE_THRESHOLD: 0.85,
  CHECK_INTERVAL: 6000,
};

export default function DynamicForm() {
  // Get formId from URL (e.g., /form/123abc or ?formId=123abc)
  const getFormId = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('formId') || window.location.pathname.split('/').pop();
  };

  const formId = getFormId();

  // State
  const [form, setForm] = useState(null);
  const [formLoading, setFormLoading] = useState(true);
  const [formError, setFormError] = useState(null);
  const [answers, setAnswers] = useState({});
  const [showReport, setShowReport] = useState(false);
  const [securityReady, setSecurityReady] = useState(false);
  const [initError, setInitError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Refs
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
    timestamps: [],
  });

  const [liveStats, setLiveStats] = useState({
    checks: 0,
    faceDetectionRate: 0,
    avgMouseActivity: 0,
    overallScore: 100,
    sessionDuration: 0,
  });

  /* ---------------- FETCH FORM FROM BACKEND ---------------- */
  useEffect(() => {
    const fetchForm = async () => {
      try {
        setFormLoading(true);
        const response = await fetch(`${API_BASE_URL}/forms/${formId}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Form not found (${response.status})`);
        }
        
        const data = await response.json();
        
        if (!data.isActive) {
          throw new Error("This form is no longer active");
        }
        
        setForm(data);
        setFormError(null);
      } catch (err) {
        console.error("Failed to load form:", err);
        setFormError(err.message);
      } finally {
        setFormLoading(false);
      }
    };

    if (formId && formId !== 'form') {
      fetchForm();
    } else {
      setFormError("No valid form ID provided in URL");
      setFormLoading(false);
    }
  }, [formId]);

  /* ---------------- SCORING ENGINE ---------------- */
  const calculateScore = useCallback(() => {
    const metrics = metricsRef.current;
    
    if (metrics.faceDetections.length === 0) return 0;

    const faceScore = metrics.faceDetections.reduce((sum, fd) => 
      sum + (fd.present ? fd.confidence : 0), 0
    ) / metrics.faceDetections.length;

    let mouseScore = 0;
    if (metrics.mouseVelocities.length > 0) {
      const avgVelocity = metrics.mouseVelocities.reduce((a, b) => a + b, 0) / 
                          metrics.mouseVelocities.length;
      
      if (avgVelocity < THRESHOLDS.MIN_MOUSE_VELOCITY) {
        mouseScore = 0.3;
      } else if (avgVelocity > THRESHOLDS.MAX_MOUSE_VELOCITY) {
        mouseScore = 0.2;
      } else {
        mouseScore = Math.min(1, avgVelocity / 500);
      }
    }

    let consistencyScore = 1.0;
    if (metrics.behaviorScores.length > 2) {
      const mean = metrics.behaviorScores.reduce((a, b) => a + b, 0) / 
                   metrics.behaviorScores.length;
      const variance = metrics.behaviorScores.reduce((sum, score) => 
        sum + Math.pow(score - mean, 2), 0
      ) / metrics.behaviorScores.length;
      
      consistencyScore = Math.max(0, 1 - variance);
    }

    const rawScore = (faceScore * 0.4) + (mouseScore * 0.3) + (consistencyScore * 0.3);
    return Math.round(Math.min(100, Math.max(0, rawScore * 100)));
  }, []);

  /* ---------------- SURVEILLANCE CHECK ---------------- */
  const runCheck = useCallback(async () => {
    if (!surveillanceRef.current.running || !modelRef.current) return;

    const checkStartTime = Date.now();
    let facePresent = false;
    let faceConfidence = 0;

    try {
      const video = videoRef.current;
      if (video && video.readyState >= 2) {
        const blazeface = await import("@tensorflow-models/blazeface");
        if (!modelRef.current) {
          modelRef.current = await blazeface.load();
        }
        
        const predictions = await modelRef.current.estimateFaces(video, false);
        
        if (predictions && predictions.length > 0) {
          facePresent = true;
          faceConfidence = predictions[0].probability?.[0] || 0.9;

          if (canvasRef.current) {
            const ctx = canvasRef.current.getContext("2d");
            canvasRef.current.width = video.videoWidth;
            canvasRef.current.height = video.videoHeight;
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

            predictions.forEach((p) => {
              const [x, y] = p.topLeft;
              const [x2, y2] = p.bottomRight;
              
              const color = faceConfidence > THRESHOLDS.FACE_CONFIDENCE_THRESHOLD 
                ? "#22c55e" : "#eab308";
              
              ctx.strokeStyle = color;
              ctx.lineWidth = 3;
              ctx.strokeRect(x, y, x2 - x, y2 - y);
              
              ctx.fillStyle = color;
              ctx.font = "16px monospace";
              ctx.fillText(`${Math.round(faceConfidence * 100)}%`, x, y - 5);
            });
          }
        } else if (canvasRef.current) {
          const ctx = canvasRef.current.getContext("2d");
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      }
    } catch (err) {
      console.error("Face detection error:", err);
    }

    const intervalData = intervalDataRef.current;
    let mouseScore = 0;
    let avgVelocity = 0;

    if (intervalData.mousePositions.length > 1) {
      const velocities = [];
      for (let i = 1; i < intervalData.mousePositions.length; i++) {
        const prev = intervalData.mousePositions[i - 1];
        const curr = intervalData.mousePositions[i];
        const distance = Math.sqrt(
          Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2)
        );
        const timeDiff = (curr.time - prev.time) / 1000;
        const velocity = timeDiff > 0 ? distance / timeDiff : 0;
        velocities.push(velocity);
      }

      avgVelocity = velocities.reduce((a, b) => a + b, 0) / velocities.length;
      metricsRef.current.mouseVelocities.push(avgVelocity);

      if (intervalData.mouseMoves < THRESHOLDS.MIN_MOUSE_MOVES_PER_CHECK) {
        mouseScore = 0.4;
      } else if (intervalData.mouseMoves > THRESHOLDS.MAX_MOUSE_MOVES_PER_CHECK) {
        mouseScore = 0.3;
      } else if (avgVelocity > THRESHOLDS.MAX_MOUSE_VELOCITY) {
        mouseScore = 0.2;
      } else {
        mouseScore = 1.0;
      }

      if (intervalData.suspiciousEvents > 0) {
        mouseScore *= 0.5;
      }
    } else {
      mouseScore = 0.3;
    }

    const intervalScore = (
      (facePresent ? faceConfidence : 0) * 0.6 + 
      mouseScore * 0.4
    );

    metricsRef.current.faceDetections.push({ 
      present: facePresent, 
      confidence: faceConfidence 
    });
    metricsRef.current.behaviorScores.push(intervalScore);
    metricsRef.current.timestamps.push(checkStartTime);

    const overallScore = calculateScore();

    const faceDetectionRate = Math.round(
      (metricsRef.current.faceDetections.filter(fd => fd.present).length / 
       metricsRef.current.faceDetections.length) * 100
    );

    setLiveStats({
      checks: metricsRef.current.faceDetections.length,
      faceDetectionRate,
      avgMouseActivity: Math.round(avgVelocity),
      overallScore,
      sessionDuration: Math.round((Date.now() - startTimeRef.current) / 1000),
    });

    intervalDataRef.current = {
      mouseMoves: 0,
      mousePositions: [],
      suspiciousEvents: 0,
      lastMouseTime: Date.now(),
    };

    if (surveillanceRef.current.running) {
      const jitter = Math.random() * 2000 - 1000;
      timeoutRef.current = setTimeout(runCheck, THRESHOLDS.CHECK_INTERVAL + jitter);
    }
  }, [calculateScore]);

  /* ---------------- INIT SECURITY MONITORING ---------------- */
  useEffect(() => {
    if (!form || formLoading) return;

    let stream = null;
    let mounted = true;

    const init = async () => {
      try {
        await tf.setBackend("webgl");
        await tf.ready();

        const blazeface = await import("@tensorflow-models/blazeface");
        modelRef.current = await blazeface.load();

        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: 640, 
            height: 480, 
            facingMode: "user" 
          },
        });

        if (!mounted) return;

        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        surveillanceRef.current.running = true;
        startTimeRef.current = Date.now();
        setSecurityReady(true);
        
        runCheck();
      } catch (err) {
        console.error("Initialization failed:", err);
        setInitError(err.message);
      }
    };

    init();

    const onMouse = (e) => {
      intervalDataRef.current.mouseMoves++;
      intervalDataRef.current.mousePositions.push({
        x: e.clientX,
        y: e.clientY,
        time: Date.now(),
      });

      if (intervalDataRef.current.mousePositions.length > 50) {
        intervalDataRef.current.mousePositions.shift();
      }

      if (!e.isTrusted) {
        intervalDataRef.current.suspiciousEvents++;
      }

      intervalDataRef.current.lastMouseTime = Date.now();
    };

    window.addEventListener("mousemove", onMouse);

    return () => {
      mounted = false;
      surveillanceRef.current.running = false;
      clearTimeout(timeoutRef.current);
      window.removeEventListener("mousemove", onMouse);
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [form, formLoading, runCheck]);

  /* ---------------- FORM HANDLERS ---------------- */
  const handleChange = (qid, value) => {
    setAnswers((prev) => ({ ...prev, [qid]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (liveStats.checks < THRESHOLDS.MIN_CHECKS_REQUIRED) {
      alert(`Please wait for security verification to complete. ${liveStats.checks}/${THRESHOLDS.MIN_CHECKS_REQUIRED} checks done.`);
      return;
    }

    const missingFields = form.questions
      .filter(q => q.required && !answers[q.id])
      .map(q => q.label);

    if (missingFields.length > 0) {
      alert(`Please fill required fields: ${missingFields.join(", ")}`);
      return;
    }

    surveillanceRef.current.running = false;
    clearTimeout(timeoutRef.current);

    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
    }

    setShowReport(true);
  };

  const finalizeSubmission = async () => {
    setSubmitting(true);

    const submissionData = {
      formId: formId,
      responses: answers,
      verification: {
        score: liveStats.overallScore,
        totalChecks: liveStats.checks,
        faceDetectionRate: liveStats.faceDetectionRate,
        sessionDuration: liveStats.sessionDuration,
        avgMouseVelocity: liveStats.avgMouseActivity,
        timestamp: new Date().toISOString(),
        rawMetrics: {
          faceDetections: metricsRef.current.faceDetections,
          mouseVelocities: metricsRef.current.mouseVelocities,
          behaviorScores: metricsRef.current.behaviorScores,
        }
      },
    };

    try {
      const response = await fetch(`${API_BASE_URL}/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Submission failed');
      }

      const result = await response.json();
      console.log("Submission successful:", result);
      
      alert("Form submitted successfully!");
      
      // Optional: Redirect to thank you page
      // window.location.href = '/thank-you';
    } catch (err) {
      console.error("Submission error:", err);
      alert(`Failed to submit form: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------- RENDER ---------------- */
  if (formLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
        <Card className="max-w-md bg-slate-800 border-slate-700">
          <CardContent className="pt-6 flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
            <h2 className="text-xl font-bold text-center">Loading Form...</h2>
            <p className="text-slate-400 text-center text-sm">
              Fetching form data from server
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (formError || !form) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
        <Card className="max-w-md bg-slate-800 border-red-500">
          <CardContent className="pt-6">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-center mb-2">Form Not Available</h2>
            <p className="text-slate-400 text-center mb-4">
              {formError || "The requested form could not be loaded."}
            </p>
            <Button 
              onClick={() => window.location.reload()} 
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
        <Card className="max-w-md bg-slate-800 border-red-500">
          <CardContent className="pt-6">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-center mb-2">Security System Error</h2>
            <p className="text-slate-400 text-center">{initError}</p>
            <p className="text-sm text-slate-500 text-center mt-4">
              Please ensure camera permissions are granted and try again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    if (score >= 40) return "text-orange-500";
    return "text-red-500";
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return "Verified Human";
    if (score >= 60) return "Likely Human";
    if (score >= 40) return "Suspicious";
    return "High Risk";
  };

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