import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import {
  ChevronRight,
  XCircle,
  Wallet,
  ArrowLeft,
  ShieldCheck,
  Mail,
  Loader2,
} from "lucide-react";
import { releasePayment } from "../../solana/releasePayment";

const API_BASE =
  import.meta.env.VITE_BACKEND_API || "http://localhost:5000/api";

export default function AdminSubmissions() {
  const wallet = useWallet();
  const { connection } = useConnection();

  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedSub, setSelectedSub] = useState(null);
  const [loading, setLoading] = useState(false);

  // Track already-paid submissions (frontend safety)
  const [paidSubmissions, setPaidSubmissions] = useState(new Set());

  /* -------------------------------------------------------------------------- */
  /* FETCH TASKS */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    fetchMyTasks();
  }, []);

  const fetchMyTasks = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await axios.get(`${API_BASE}/forms/admin/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(res.data || []);
    } catch (err) {
      console.error("Fetch tasks failed", err);
    }
  };

  const loadSubmissions = async (formId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      const res = await axios.get(
        `${API_BASE}/form-responses/${formId}/responses`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSelectedTask({
        form: res.data.form,
        submissions: res.data.submissions || [],
      });
    } catch (err) {
      console.error("Load submissions failed", err);
    } finally {
      setLoading(false);
    }
  };

  /* -------------------------------------------------------------------------- */
  /* PAYOUT */
  /* -------------------------------------------------------------------------- */

  const handleReleasePayment = async (sub) => {
    if (!wallet.connected || !wallet.publicKey) {
      return alert("Please connect your admin wallet first");
    }

    const task = selectedTask?.form;
    const recipientPubkey = sub.userId?.solanaPublicKey;

    if (!task?.escrowAddress) {
      return alert("This task has no escrow address");
    }

    if (!recipientPubkey) {
      return alert("User Solana wallet not found");
    }

    if (!sub.verification?.passed) {
      return alert("Cannot pay: submission failed verification");
    }

    if (paidSubmissions.has(sub._id)) {
      return alert("Payment already completed for this submission");
    }

    try {
      setLoading(true);

      await releasePayment({
        wallet,
        connection,
        escrowAddress: task.escrowAddress,
        recipient: recipientPubkey,
      });

      // Lock this submission from being paid again
      setPaidSubmissions((prev) => new Set(prev).add(sub._id));

      alert("✅ Payment released successfully on Solana");
    } catch (err) {
      console.error("Payment failed", err);
      alert("Payment failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  /* -------------------------------------------------------------------------- */
  /* VIEW 1: TASK LIST */
  /* -------------------------------------------------------------------------- */

  if (!selectedTask) {
    return (
      <div className="p-8 bg-slate-900 min-h-screen text-white">
        <h1 className="text-3xl font-bold mb-6">Manage Your Tasks</h1>

        {loading ? (
          <div className="flex justify-center p-10">
            <Loader2 className="animate-spin" />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tasks.map((t) => (
              <Card
                key={t._id}
                className="bg-slate-800 border-slate-700 cursor-pointer hover:border-indigo-500 transition"
                onClick={() => loadSubmissions(t._id)}
              >
                <CardContent className="p-6 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-lg">{t.title}</h3>
                    <p className="text-indigo-400 font-mono text-sm">
                      {t.reward} SOL • {t.type}
                    </p>
                  </div>
                  <ChevronRight className="text-slate-500" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* -------------------------------------------------------------------------- */
  /* VIEW 2: SUBMISSIONS LIST */
  /* -------------------------------------------------------------------------- */

  if (selectedTask && !selectedSub) {
    return (
      <div className="p-8 bg-slate-900 min-h-screen text-white">
        <Button
          variant="ghost"
          onClick={() => setSelectedTask(null)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Tasks
        </Button>

        <h1 className="text-2xl font-bold mb-6">
          Submissions for {selectedTask.form?.title}
        </h1>

        <div className="space-y-3">
          {selectedTask.submissions.length === 0 ? (
            <p className="text-slate-500 italic">No responses yet.</p>
          ) : (
            selectedTask.submissions.map((s) => (
              <div
                key={s._id}
                onClick={() => setSelectedSub(s)}
                className="p-4 bg-slate-800 rounded-lg flex justify-between items-center cursor-pointer hover:border-slate-500 border border-transparent"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-slate-700 rounded-full flex items-center justify-center font-bold text-indigo-400">
                    {s.userId?.name?.charAt(0) || "A"}
                  </div>
                  <div>
                    <p className="font-medium">
                      {s.userId?.name || "Anonymous"}
                    </p>
                    <p className="text-xs text-slate-400 flex items-center gap-1">
                      <Mail className="w-3 h-3" /> {s.userId?.email}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xs text-slate-500 uppercase">
                    Integrity Score
                  </p>
                  <p className="font-mono text-indigo-400">
                    {s.verification?.netScore ?? 0}%
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------------------------- */
  /* VIEW 3: DETAILED REVIEW */
  /* -------------------------------------------------------------------------- */

  return (
    <div className="p-8 bg-slate-900 min-h-screen text-white">
      <Button
        variant="ghost"
        onClick={() => setSelectedSub(null)}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Submissions
      </Button>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* ANSWERS */}
        <div className="lg:col-span-2">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle>User Responses</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {selectedTask.form.questions.map((q) => {
                const qId = String(q._id);
                const ans = selectedSub.answers.find(
                  (a) => String(a.questionId) === qId
                );

                return (
                  <div key={qId}>
                    <p className="text-sm text-slate-400">{q.label}</p>
                    <div className="bg-slate-900 p-4 rounded border border-slate-700">
                      {ans?.value ?? (
                        <span className="italic text-slate-600">
                          No answer provided
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* REVIEW & PAYOUT */}
        <div className="space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle>Review & Payout</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck
                  className={
                    selectedSub.verification?.passed
                      ? "text-green-500"
                      : "text-red-500"
                  }
                />
                <span className="font-bold uppercase text-sm">
                  {selectedSub.verification?.passed
                    ? "Security Passed"
                    : "Security Flagged"}
                </span>
              </div>

              <Button
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-600"
                onClick={() => handleReleasePayment(selectedSub)}
                disabled={
                  !selectedSub.verification?.passed ||
                  loading ||
                  paidSubmissions.has(selectedSub._id)
                }
              >
                <Wallet className="w-4 h-4 mr-2" />
                {paidSubmissions.has(selectedSub._id)
                  ? "Payment Completed"
                  : `Release ${selectedTask.form.reward} SOL`}
              </Button>

              {!selectedSub.verification?.passed && (
                <p className="text-xs text-red-400 text-center">
                  Payment disabled due to failed verification
                </p>
              )}
            </CardContent>
          </Card>

          <p className="text-[10px] text-slate-600 font-mono text-center">
            Escrow Address:
            <br />
            {selectedTask.form.escrowAddress}
          </p>
        </div>
      </div>
    </div>
  );
}
