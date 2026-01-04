import { useEffect, useState, useRef, useCallback } from "react";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Shield, Camera, Activity, Loader2 } from "lucide-react";

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

      window.location.href = "/my-submission";
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
      <div className="min-h-screen flex items-center justify-center text-white">
        <Loader2 className="animate-spin mr-2" />
        Loading form…
      </div>
    );

  if (formError)
    return <div className="p-10 text-red-400">{formError}</div>;

  const progress =
    Math.min(liveStats.checks / THRESHOLDS.MIN_CHECKS_REQUIRED, 1) * 100;

  /* -------------------------------------------------------------------------- */
  /* UI */
  /* -------------------------------------------------------------------------- */

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      {/* CAMERA */}
      <video
        ref={videoRef}
        muted
        autoPlay
        playsInline
        className="fixed bottom-6 left-6 w-48 rounded border border-green-500"
      />

      {/* VERIFICATION PROGRESS (NO NUMBERS) */}
      <div className="max-w-xl mx-auto mb-6">
        <Card className="bg-slate-800">
          <CardContent className="pt-6 space-y-3">
            <div className="text-xs text-slate-400">
              Initializing verification system
            </div>
            <div className="w-full bg-slate-700 h-2 rounded overflow-hidden">
              <div
                className="bg-green-500 h-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FORM (DISABLED UNTIL READY) */}
      <Card className="max-w-xl mx-auto bg-slate-800">
        <CardHeader>
          <CardTitle>{form.title}</CardTitle>
          <p className="text-slate-400">{form.description}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {form.questions.map((q) => {
            const qId = q._id;
            return (
              <div key={qId}>
                <Label>
                  {q.label}
                  {q.required && <span className="text-red-400">*</span>}
                </Label>

                {q.type === "text" && (
                  <Input
                    disabled={!systemReady}
                    value={answers[qId] || ""}
                    onChange={(e) =>
                      setAnswers((p) => ({ ...p, [qId]: e.target.value }))
                    }
                  />
                )}

                {q.type === "textarea" && (
                  <Textarea
                    disabled={!systemReady}
                    value={answers[qId] || ""}
                    onChange={(e) =>
                      setAnswers((p) => ({ ...p, [qId]: e.target.value }))
                    }
                  />
                )}
              </div>
            );
          })}

          <Button
            onClick={handleSubmit}
            disabled={!systemReady}
            className="w-full bg-green-600"
          >
            Submit Form
          </Button>
        </CardContent>
      </Card>

      {/* SUBMIT POPUP */}
      {showReport && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
          <Card className="bg-slate-800 p-10 text-center max-w-md w-full">
            {submitStatus === "verifying" && (
              <>
                <Loader2 className="w-10 h-10 mx-auto mb-4 animate-spin text-yellow-400" />
                <h2 className="text-xl font-bold">
                  Verification still running
                </h2>
              </>
            )}

            {submitStatus === "bot" && (
              <>
                <Shield className="w-12 h-12 mx-auto mb-4 text-red-500" />
                <h2 className="text-xl font-bold text-red-400">
                  Bot-like behaviour detected
                </h2>
              </>
            )}

            {submitStatus === "confirm" && (
              <>
                <h2 className="text-xl font-bold mb-6">
                  Confirm submission
                </h2>
                <Button
                  onClick={finalizeSubmission}
                  disabled={submitting}
                  className="w-full bg-green-600"
                >
                  {submitting ? (
                    <Loader2 className="animate-spin" />
                  ) : (
                    "Confirm & Submit"
                  )}
                </Button>
              </>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
