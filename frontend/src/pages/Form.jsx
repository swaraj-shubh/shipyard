import { useEffect, useState, useRef, useCallback } from "react";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";
import { motion } from "framer-motion";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Shield, Camera, Activity, Loader2, User, CheckCircle, AlertCircle, Eye, Clock, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
/* -------------------------------------------------------------------------- */
/* CONFIG */
/* -------------------------------------------------------------------------- */

const API_BASE_URL =
  import.meta.env.VITE_BACKEND_API || "http://localhost:5000/api";

const THRESHOLDS = {
  MIN_CHECKS_REQUIRED: 5,
  CHECK_INTERVAL: 6000,
};

const MIN_NET_SCORE = 70;

/* -------------------------------------------------------------------------- */
/* COMPONENT */
/* -------------------------------------------------------------------------- */

export default function DynamicForm() {
  const navigate = useNavigate();
  const getFormId = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get("formId") || window.location.pathname.split("/").pop();
  };

  const formId = getFormId();

  /* ----------------------------- STATE ----------------------------- */

  const [form, setForm] = useState(null);
  const [answers, setAnswers] = useState({});
  const [formLoading, setFormLoading] = useState(true);
  const [formError, setFormError] = useState(null);

  const [systemReady, setSystemReady] = useState(false); // ✅ NEW
  const [submitting, setSubmitting] = useState(false);

  const [showReport, setShowReport] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const [liveStats, setLiveStats] = useState({
    checks: 0,
    overallScore: 100,
  });

  /* ----------------------------- REFS ----------------------------- */

  const videoRef = useRef(null);
  const modelRef = useRef(null);
  const timeoutRef = useRef(null);
  const surveillanceRef = useRef({ running: false });
  const metricsRef = useRef({ faceDetections: [] });

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

    fetchForm();
  }, [formId]);

  /* -------------------------------------------------------------------------- */
  /* SCORING */
  /* -------------------------------------------------------------------------- */

  const calculateScore = useCallback(() => {
    const faces = metricsRef.current.faceDetections;
    if (!faces.length) return 0;
    return Math.round(
      (faces.reduce((s, f) => s + f.confidence, 0) / faces.length) * 100
    );
  }, []);

  /* -------------------------------------------------------------------------- */
  /* SURVEILLANCE */
  /* -------------------------------------------------------------------------- */

  const runCheck = useCallback(async () => {
    if (!surveillanceRef.current.running) return;

    try {
      const predictions = await modelRef.current.estimateFaces(
        videoRef.current,
        false
      );

      metricsRef.current.faceDetections.push({
        confidence: predictions.length ? 0.9 : 0.2,
      });

      setLiveStats((p) => ({
        checks: p.checks + 1,
        overallScore: calculateScore(),
      }));

      // ✅ system becomes usable after first successful check
      setSystemReady(true);
    } catch {}

    timeoutRef.current = setTimeout(runCheck, THRESHOLDS.CHECK_INTERVAL);
  }, [calculateScore]);

  /* -------------------------------------------------------------------------- */
  /* INIT CAMERA + MODEL */
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
          runCheck();
        };
      } catch (e) {
        console.error("Initialization error:", e);
      }
    })();

    return () => {
      surveillanceRef.current.running = false;
      clearTimeout(timeoutRef.current);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [form, runCheck]);

  /* -------------------------------------------------------------------------- */
  /* SUBMIT FLOW */
  /* -------------------------------------------------------------------------- */

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!systemReady || liveStats.checks < THRESHOLDS.MIN_CHECKS_REQUIRED) {
      setSubmitStatus("verifying");
      setShowReport(true);
      return;
    }

    if (calculateScore() < MIN_NET_SCORE) {
      setSubmitStatus("bot");
      setShowReport(true);
      return;
    }

    setSubmitStatus("confirm");
    setShowReport(true);
  };

  const finalizeSubmission = async () => {
    setSubmitting(true);

    const formattedAnswers = Object.entries(answers).map(
      ([questionId, value]) => ({ questionId, value })
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
              netScore: calculateScore(),
              passed: true,
            },
          }),
        }
      );

      if (!res.ok) throw new Error("Submission failed");

      window.location.href = "/my-submissions";
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  /* -------------------------------------------------------------------------- */
  /* RENDER STATES */
  /* -------------------------------------------------------------------------- */

  if (formLoading)
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-teal-50 to-white"
      >
        <div className="text-center space-y-4">
          <div className="h-12 w-12 border-4 border-teal-100 border-t-teal-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-800 font-medium">Loading form...</p>
        </div>
      </motion.div>
    );

  if (formError)
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen flex items-center justify-center p-4"
      >
        <Card className="max-w-md border-red-200 bg-white shadow-xl">
          <CardContent className="pt-8 pb-8">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-red-600 mb-2">Form Error</h3>
                <p className="text-gray-600">{formError}</p>
              </div>
              <Button 
                onClick={() => window.location.href = "/dashboard"}
                className="bg-gray-900 hover:bg-black text-white"
              >
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );

  const progress =
    Math.min(liveStats.checks / THRESHOLDS.MIN_CHECKS_REQUIRED, 1) * 100;

  /* -------------------------------------------------------------------------- */
  /* UI - TWO COLUMN LAYOUT */
  /* -------------------------------------------------------------------------- */

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-b from-teal-50 via-white to-teal-50/30"
    >
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-teal-600 to-cyan-600 flex items-center justify-center">
              <Eye className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Form Submission</h1>
              <p className="text-gray-600">Complete the form with live verification</p>
            </div>
          </div>
        </motion.div>


              {/* Verification Status Card */}
              <Card className="border-gray-200 mb-3 bg-white/90 backdrop-blur-sm shadow-xl">
                
                <CardContent className="pt-6 space-y-4">
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-700 font-medium">Verification Progress</span>
                      <span className="text-gray-900 font-bold">{liveStats.checks}/{THRESHOLDS.MIN_CHECKS_REQUIRED}</span>
                    </div>
                    <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                      <motion.div
                        className="bg-gradient-to-r from-teal-500 to-emerald-500 h-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      {systemReady ? '✓ System ready' : 'Initializing verification...'}
                    </p>
                  </div>

 
                </CardContent>
              </Card>


        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
          {/* Left Column - Camera & Verification */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="space-y-6"
            >
              {/* Camera Card */}
              <Card className="border-gray-200 bg-white/90 backdrop-blur-sm shadow-xl">
                <CardHeader className="pb-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-teal-100 flex items-center justify-center">
                      <Camera className="h-5 w-5 text-teal-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-gray-900">Live Verification</CardTitle>
                      <p className="text-sm text-gray-600">Camera feed for human verification</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="relative rounded-xl overflow-hidden border-2 border-teal-300 bg-black">
                    <video
                      ref={videoRef}
                      muted
                      autoPlay
                      playsInline
                      className="w-full h-auto aspect-video object-cover"
                    />
                    <div className="absolute inset-0 border-4 border-transparent border-t-teal-400 border-l-teal-400 pointer-events-none"></div>
                    <div className="absolute inset-0 border-4 border-transparent border-b-teal-400 border-r-teal-400 pointer-events-none"></div>
                    <div className="absolute top-4 left-4 flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse"></div>
                      <span className="text-xs text-white font-medium">LIVE</span>
                    </div>
                  </div>
                </CardContent>
              </Card>


            </motion.div>
          </div>

          {/* Right Column - Form */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-gray-200 bg-white/90 backdrop-blur-sm shadow-xl h-full">
                <CardHeader className="pb-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl text-gray-900">{form.title}</CardTitle>
                        <p className="text-gray-600">{form.description}</p>
                      </div>
                    </div>
                    {form.reward > 0 && (
                      <div className="px-4 py-2 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-200">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-amber-600" />
                          <span className="font-bold text-amber-800">{form.reward} SOL Reward</span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="pt-6">
                  <form onSubmit={handleSubmit} className="space-y-8">
                    {form.questions.map((q, index) => {
                      const qId = q._id;
                      return (
                        <motion.div
                          key={qId}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="space-y-3"
                        >
                          <div className="flex items-center gap-2">
                            <Label className="text-lg font-medium text-gray-900">
                              {q.label}
                              {q.required && <span className="text-red-500 ml-1">*</span>}
                            </Label>
                            {!systemReady && (
                              <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-600">
                                Disabled until verified
                              </span>
                            )}
                          </div>

                          {q.type === "text" && (
                            <Input
                              disabled={!systemReady}
                              value={answers[qId] || ""}
                              onChange={(e) =>
                                setAnswers((p) => ({ ...p, [qId]: e.target.value }))
                              }
                              className={`border-gray-300 focus:border-teal-500 focus:ring-teal-200 ${!systemReady ? 'bg-gray-50' : ''}`}
                              placeholder="Type your answer here..."
                              required={q.required}
                            />
                          )}

                          {q.type === "textarea" && (
                            <Textarea
                              disabled={!systemReady}
                              value={answers[qId] || ""}
                              onChange={(e) =>
                                setAnswers((p) => ({ ...p, [qId]: e.target.value }))
                              }
                              className={`border-gray-300 focus:border-teal-500 focus:ring-teal-200 min-h-[120px] ${!systemReady ? 'bg-gray-50' : ''}`}
                              placeholder="Type your detailed answer here..."
                              required={q.required}
                            />
                          )}
                          
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <div className="flex items-center gap-2">
                              {q.required && (
                                <div className="h-2 w-2 rounded-full bg-teal-500"></div>
                              )}
                              <span>{q.required ? 'Required field' : 'Optional'}</span>
                            </div>
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                              Question {index + 1} of {form.questions.length}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="pt-6 border-t border-gray-200"
                    >
                      <Button
                        type="submit"
                        disabled={!systemReady}
                        className="w-full bg-gradient-to-r from-gray-900 to-black hover:from-gray-800 hover:to-gray-900 text-white py-6 text-lg"
                      >
                        {!systemReady ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                            Waiting for Verification...
                          </>
                        ) : (
                          'Submit Form'
                        )}
                      </Button>
                      {!systemReady && (
                        <p className="text-sm text-gray-600 text-center mt-3">
                          Form will be enabled once human verification is complete
                        </p>
                      )}
                    </motion.div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* SUBMIT POPUP MODAL */}
      {showReport && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md"
          >
            <Card className="border-gray-200 bg-white shadow-2xl">
              <CardContent className="pt-8 pb-8">
                <div className="text-center space-y-6">
                  {submitStatus === "verifying" && (
                    <>
                      <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
                        <Loader2 className="h-8 w-8 text-amber-600 animate-spin" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification In Progress</h2>
                        <p className="text-gray-600">
                          Please wait for the verification process to complete. 
                          {liveStats.checks < THRESHOLDS.MIN_CHECKS_REQUIRED && 
                            ` Need ${THRESHOLDS.MIN_CHECKS_REQUIRED - liveStats.checks} more checks.`
                          }
                        </p>
                      </div>
                      <Button
                        onClick={() => setShowReport(false)}
                        className="bg-gray-900 hover:bg-black text-white"
                      >
                        Continue Verification
                      </Button>
                    </>
                  )}

                  {submitStatus === "bot" && (
                    <>
                      <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                        <AlertCircle className="h-8 w-8 text-red-600" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-red-600 mb-2">Verification Failed</h2>
                        <p className="text-gray-600">
                          Human verification failed. Please ensure you're visible in the camera 
                          and try again. Current score: {calculateScore()}% (minimum {MIN_NET_SCORE}% required)
                        </p>
                      </div>
                      <Button
                        onClick={() => setShowReport(false)}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        Try Again
                      </Button>
                    </>
                  )}

                  {submitStatus === "confirm" && (
                    <>
                      <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                        <CheckCircle className="h-8 w-8 text-emerald-600" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Confirm Submission</h2>
                        <p className="text-gray-600">
                          {/* Your verification score is <span className="font-bold text-emerald-600">{calculateScore()}%</span>. */}
                          Ready to submit your responses?
                        </p>
                      </div>
                      <div className="space-y-3">
                        <Button
                          onClick={finalizeSubmission}
                          disabled={submitting}
                          className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white"
                        >
                          {submitting ? (
                            <>
                              <Loader2 className="h-5 w-5 animate-spin mr-2" />
                              Submitting...
                            </>
                          ) : (
                            'Confirm & Submit'
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowReport(false)}
                          className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                          Review Answers
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}
