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
  /* ----------------------------- HELPERS ----------------------------- */

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
  const [showReport, setShowReport] = useState(false);
  const [securityReady, setSecurityReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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

    const avg =
      faces.reduce((s, f) => s + f.confidence, 0) / faces.length;

    return Math.round(avg * 100);
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
    } catch {}

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
          setSecurityReady(true);
          runCheck();
        };
      } catch (e) {
        console.error(e);
      }
    })();

    return () => {
      surveillanceRef.current.running = false;
      clearTimeout(timeoutRef.current);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [form, runCheck]);

  /* -------------------------------------------------------------------------- */
  /* SUBMIT */
  /* -------------------------------------------------------------------------- */

  const handleSubmit = (e) => {
    e.preventDefault();

    if (liveStats.checks < THRESHOLDS.MIN_CHECKS_REQUIRED) {
      alert("Verification still running");
      return;
    }

    if (calculateScore() < MIN_NET_SCORE) {
      alert("Integrity score too low");
      return;
    }

    setShowReport(true);
  };

  const finalizeSubmission = async () => {
    setSubmitting(true);

    const netScore = calculateScore();

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

      if (!res.ok) throw new Error("Submission failed");

      // ✅ CLEAN EXIT
      setShowReport(false);
      setSubmitted(true);
      surveillanceRef.current.running = false;
      clearTimeout(timeoutRef.current);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  /* -------------------------------------------------------------------------- */
  /* RENDER STATES */
  /* -------------------------------------------------------------------------- */

  if (formLoading) return <div className="p-10 text-white">Loading...</div>;
  if (formError) return <div className="p-10 text-red-400">{formError}</div>;

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Card className="bg-slate-800 p-8 text-center">
          <Shield className="w-12 h-12 mx-auto mb-4 text-green-400" />
          <h2 className="text-2xl font-bold text-white">Submission Complete</h2>
          <p className="text-slate-400 mt-2">
            This task is no longer available to you.
          </p>
        </Card>
      </div>
    );
  }

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

      {/* DASHBOARD */}
      <div className="max-w-xl mx-auto mb-6">
        <Card className="bg-slate-800">
          <CardContent className="pt-6 grid grid-cols-3 text-center">
            <div>
              <Shield className="mx-auto mb-1" />
              {liveStats.checks}
            </div>
            <div>
              <Camera className="mx-auto mb-1" />
              Active
            </div>
            <div>
              <Activity className="mx-auto mb-1" />
              {liveStats.overallScore}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FORM */}
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
                    value={answers[qId] || ""}
                    onChange={(e) =>
                      setAnswers((p) => ({ ...p, [qId]: e.target.value }))
                    }
                    required={q.required}
                  />
                )}

                {q.type === "textarea" && (
                  <Textarea
                    value={answers[qId] || ""}
                    onChange={(e) =>
                      setAnswers((p) => ({ ...p, [qId]: e.target.value }))
                    }
                    required={q.required}
                  />
                )}
              </div>
            );
          })}

          <Button
            onClick={handleSubmit}
            disabled={!securityReady}
            className="w-full bg-green-600"
          >
            Submit Form
          </Button>
        </CardContent>
      </Card>

      {/* REPORT */}
      {showReport && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center">
          <Card className="bg-slate-800 p-10 text-center">
            <div className="text-6xl font-bold mb-4">
              {liveStats.overallScore}%
            </div>
            <Button
              onClick={finalizeSubmission}
              disabled={submitting}
              className="bg-green-600"
            >
              {submitting ? <Loader2 className="animate-spin" /> : "Confirm"}
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}
