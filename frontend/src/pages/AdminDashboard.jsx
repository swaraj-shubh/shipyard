import { useEffect, useState } from "react";
import axios from "axios";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, XCircle, Wallet, ArrowLeft, ShieldCheck, Mail } from "lucide-react";

/* 🔗 Solana Imports (Ensure these match your project structure) */
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
// import { releasePayment } from "../../solana/releasePayment"; 

const API_BASE = import.meta.env.VITE_BACKEND_API || "http://localhost:5000/api";

export default function AdminSubmissions() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null); // { form, submissions }
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
      // This endpoint hits your getFormResponses controller
      const res = await axios.get(`${API_BASE}/form-responses/${formId}/responses`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSelectedTask(res.data); // Res contains { form, submissions }
    } catch (err) {
      console.error("Load submissions failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReleasePayment = async (sub) => {
    if (!wallet.publicKey) return alert("Please connect your wallet first");
    
    const task = selectedTask.form;
    if (!task.escrowAddress) return alert("This task has no associated Escrow.");

    try {
      setLoading(true);
      // Logic for calling your Solana program 'release' instruction
      console.log(`Releasing ${task.reward} SOL from ${task.escrowAddress} to ${sub.userId?.name}`);
      
      /* Example call:
      await releasePayment({
        wallet,
        connection,
        escrowAddress: task.escrowAddress,
        recipient: sub.userId.walletAddress, // Ensure your User model stores this
        taskHash: task.taskHash
      });
      */
      
      alert("✅ Payment released successfully on Solana!");
    } catch (err) {
      console.error("Payment failed", err);
      alert("Payment failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  /* ================= VIEW 1: TASK LIST ================= */
  if (!selectedTask) {
    return (
      <div className="p-8 bg-slate-900 min-h-screen text-white">
        <h1 className="text-3xl font-bold mb-6">Task Command Center</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((t) => (
            <Card 
              key={t._id} 
              className="bg-slate-800 border-slate-700 hover:border-indigo-500 cursor-pointer transition-all"
              onClick={() => loadSubmissions(t._id)}
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-xl">{t.title}</h3>
                    <p className="text-indigo-400 text-sm font-mono mt-1">{t.reward} SOL Reward</p>
                  </div>
                  <div className="bg-slate-700 px-2 py-1 rounded text-xs uppercase">{t.type}</div>
                </div>
                <div className="mt-4 flex items-center text-slate-400 text-sm">
                   View Submissions <ChevronRight size={16} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  /* ================= VIEW 2: PARTICIPANT LIST ================= */
  if (selectedTask && !selectedSub) {
    return (
      <div className="p-8 bg-slate-900 min-h-screen text-white">
        <Button variant="ghost" onClick={() => setSelectedTask(null)} className="mb-6 hover:bg-slate-800">
          <ArrowLeft className="mr-2" /> Back to Dashboard
        </Button>
        <h2 className="text-2xl font-bold mb-4">Participants for {selectedTask.form.title}</h2>
        
        <div className="space-y-3">
          {selectedTask.submissions.map((s) => (
            <Card key={s._id} className="bg-slate-800 border-slate-700 hover:bg-slate-750 cursor-pointer" onClick={() => setSelectedSub(s)}>
              <CardContent className="p-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-indigo-500 rounded-full flex items-center justify-center font-bold">
                    {s.userId?.name?.charAt(0) || "U"}
                  </div>
                  <div>
                    <p className="font-medium">{s.userId?.name || "Anonymous User"}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1"><Mail size={12}/> {s.userId?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                   <div className="text-right mr-4">
                     <p className="text-xs text-slate-500 uppercase">Integrity Score</p>
                     <p className={`font-bold ${s.verification?.passed ? 'text-green-400' : 'text-red-400'}`}>
                       {s.verification?.netScore || 0}%
                     </p>
                   </div>
                   <ChevronRight className="text-slate-500" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  /* ================= VIEW 3: INDIVIDUAL REVIEW ================= */
  return (
    <div className="p-8 bg-slate-900 min-h-screen text-white">
      <Button variant="ghost" onClick={() => setSelectedSub(null)} className="mb-6">
        <ArrowLeft className="mr-2" /> Back to Participants
      </Button>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: Answers */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader className="border-b border-slate-700">
              <CardTitle>Submission Details</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {selectedTask.form.questions.map((q) => {
                const answer = selectedSub.answers.find(a => a.questionId === q.id || a.questionId === q._id);
                return (
                  <div key={q.id || q._id} className="space-y-1">
                    <p className="text-sm text-slate-400 font-medium">{q.label}</p>
                    <p className="text-lg bg-slate-900 p-3 rounded border border-slate-700">
                      {answer?.value || <span className="text-slate-600 italic">No response</span>}
                    </p>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Right: Security & Payout */}
        <div className="space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader><CardTitle>Verification Report</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-slate-900 rounded-lg flex justify-between items-center">
                <span>Proof of Human:</span>
                {selectedSub.verification?.passed ? (
                  <span className="text-green-400 flex items-center gap-1 font-bold"><ShieldCheck size={16}/> PASSED</span>
                ) : (
                  <span className="text-red-400 font-bold">FAILED</span>
                )}
              </div>
              
              <div className="text-center py-4">
                <p className="text-slate-400 text-sm">Human Confidence Score</p>
                <p className="text-5xl font-black text-indigo-500">{selectedSub.verification?.netScore || 0}%</p>
              </div>

              <hr className="border-slate-700" />

              <div className="space-y-3">
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700 h-12 text-lg"
                  onClick={() => handleReleasePayment(selectedSub)}
                  disabled={loading}
                >
                  <Wallet className="mr-2" /> {loading ? "Processing..." : `Pay ${selectedTask.form.reward} SOL`}
                </Button>
                <Button variant="outline" className="w-full border-slate-600 hover:bg-red-900/20 hover:text-red-500">
                  <XCircle className="mr-2" /> Reject Submission
                </Button>
              </div>
              <p className="text-[10px] text-slate-500 text-center font-mono break-all">
                Escrow: {selectedTask.form.escrowAddress}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}