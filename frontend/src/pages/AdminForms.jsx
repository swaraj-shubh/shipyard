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
  Loader2 
} from "lucide-react";
import { releasePayment } from "../../solana/releasePayment";

const API_BASE = import.meta.env.VITE_BACKEND_API || "http://localhost:5000/api";

export default function AdminSubmissions() {
  const wallet = useWallet();
  const { connection } = useConnection();

  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedSub, setSelectedSub] = useState(null);
  const [loading, setLoading] = useState(false);

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

      // IMPORTANT: Ensure backend returns { form, submissions }
      // If backend only returns the array, change this to: 
      // setSelectedTask({ form: tasks.find(t => t._id === formId), submissions: res.data });
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

  try {
    setLoading(true);

    console.log("Admin wallet:", wallet.publicKey.toBase58());
    console.log("Escrow:", task.escrowAddress);
    console.log("Recipient:", recipientPubkey);

    await releasePayment({
      wallet,
      connection,
      escrowAddress: task.escrowAddress,
      recipient: recipientPubkey,
    });

    alert("✅ Payment released successfully on Solana");
  } catch (err) {
    console.error("Payment failed", err);
    alert("Payment failed: " + err.message);
  } finally {
    setLoading(false);
  }
};


  /* -------------------------------------------------------------------------- */
  /* VIEW 1: TASK LIST                              */
  /* -------------------------------------------------------------------------- */
  if (!selectedTask) {
    return (
      <div className="p-8 bg-slate-900 min-h-screen text-white">
        <h1 className="text-3xl font-bold mb-6">Manage Your Tasks</h1>
        {loading ? (
          <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tasks.map((t) => (
              <Card
                key={t._id}
                className="bg-slate-800 border-slate-700 cursor-pointer hover:border-indigo-500 transition shadow-xl"
                onClick={() => loadSubmissions(t._id)}
              >
                <CardContent className="p-6 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-lg">{t.title}</h3>
                    <p className="text-indigo-400 font-mono text-sm">
                      {t.reward} SOL • <span className="capitalize">{t.type}</span>
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
  /* VIEW 2: SUBMISSIONS LIST                          */
  /* -------------------------------------------------------------------------- */
  if (selectedTask && !selectedSub) {
    return (
      <div className="p-8 bg-slate-900 min-h-screen text-white">
        <Button variant="ghost" onClick={() => setSelectedTask(null)} className="mb-4 text-slate-400 hover:text-white">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Tasks
        </Button>

        <h1 className="text-2xl font-bold mb-6">
          Submissions for {selectedTask.form?.title || "Task"}
        </h1>

        <div className="space-y-3">
          {selectedTask.submissions.length === 0 ? (
            <p className="text-slate-500 italic">No responses yet.</p>
          ) : (
            selectedTask.submissions.map((s) => (
              <div
                key={s._id}
                onClick={() => setSelectedSub(s)}
                className="p-4 bg-slate-800 rounded-lg flex justify-between items-center cursor-pointer hover:border-slate-500 border border-transparent transition"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-slate-700 rounded-full flex items-center justify-center font-bold text-indigo-400">
                    {s.userId?.name?.charAt(0) || "A"}
                  </div>
                  <div>
                    <p className="font-medium">{s.userId?.name || "Anonymous"}</p>
                    <p className="text-xs text-slate-400">{s.userId?.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] text-slate-500 uppercase">Integrity Score</p>
                    <p className="font-mono text-indigo-400">{s.verification?.netScore ?? 0}%</p>
                  </div>
                  <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                    s.verification?.passed ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                  }`}>
                    {s.verification?.passed ? "Passed" : "Flagged"}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------------------------- */
  /* VIEW 3: DETAILED REVIEW                           */
  /* -------------------------------------------------------------------------- */
  return (
    <div className="p-8 bg-slate-900 min-h-screen text-white">
      <Button variant="ghost" onClick={() => setSelectedSub(null)} className="mb-4 text-slate-400 hover:text-white">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Submissions
      </Button>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Answers Section */}
        <div className="lg:col-span-2">
          <Card className="bg-slate-800 border-slate-700 shadow-2xl">
            <CardHeader className="border-b border-slate-700">
              <CardTitle>User Responses</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {selectedTask.form?.questions.map((q) => {
                // Find answer matching the question ID
                const ans = selectedSub.answers.find(a => String(a.questionId) === String(q.id || q._id));
                return (
                  <div key={q.id || q._id} className="space-y-2">
                    <label className="text-sm text-slate-400 font-medium">{q.label}</label>
                    <div className="bg-slate-900 p-4 rounded-md border border-slate-700">
                      {ans?.value || <span className="text-slate-600 italic">No answer provided</span>}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: Security & Payment */}
        <div className="space-y-6">
          <Card className="bg-slate-800 border-slate-700 border-l-4 border-l-indigo-500">
            <CardHeader>
              <CardTitle className="text-lg">Review & Payout</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Human Confidence</span>
                  <span className="text-indigo-400 font-bold">{selectedSub.verification?.netScore ?? 0}%</span>
                </div>
                <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-500 h-full transition-all" 
                    style={{ width: `${selectedSub.verification?.netScore ?? 0}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-slate-900 rounded border border-slate-700">
                <ShieldCheck className={selectedSub.verification?.passed ? "text-green-500" : "text-red-500"} />
                <span className="text-sm uppercase font-bold tracking-wider">
                  {selectedSub.verification?.passed ? "Security Passed" : "Security Flagged"}
                </span>
              </div>

              <div className="pt-4 space-y-3">
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-12"
                  onClick={() => handleReleasePayment(selectedSub)}
                >
                  <Wallet className="w-5 h-5 mr-2" />
                  Release {selectedTask.form?.reward} SOL
                </Button>

                <Button variant="outline" className="w-full border-slate-600 text-slate-400 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500">
                  <XCircle className="w-5 h-5 mr-2" />
                  Reject Submission
                </Button>
              </div>
            </CardContent>
          </Card>

          <p className="text-[10px] text-slate-600 font-mono text-center">
            Escrow Address: <br /> {selectedTask.form?.escrowAddress}
          </p>
        </div>
      </div>
    </div>
  );
}