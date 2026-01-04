import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
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
  User,
  FileText,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Calendar,
  Clock,
  Award
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
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-8 min-h-screen bg-gradient-to-b from-teal-50 via-white to-teal-50/30"
      >
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-teal-600 to-cyan-600 flex items-center justify-center">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Manage Your Tasks</h1>
                <p className="text-gray-600 mt-1">Review submissions and release payments</p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 mt-6">
              <div className="px-4 py-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-teal-600" />
                  <span className="text-sm text-gray-600">Total Tasks</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 mt-1">{tasks.length}</p>
              </div>
              
              <div className="px-4 py-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-amber-600" />
                  <span className="text-sm text-gray-600">With Rewards</span>
                </div>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {tasks.filter(t => t.reward > 0).length}
                </p>
              </div>
            </div>
          </motion.div>

          {loading ? (
            <div className="flex justify-center p-16">
              <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 text-teal-600 animate-spin mx-auto" />
                <p className="text-gray-600">Loading your tasks...</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {tasks.map((t, index) => (
                <motion.div
                  key={t._id}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  <Card
                    className="border-gray-200 bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all cursor-pointer hover:border-teal-300"
                    onClick={() => loadSubmissions(t._id)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-gray-900 truncate">{t.title}</h3>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="px-2 py-1 text-xs font-medium rounded bg-teal-100 text-teal-800">
                              {t.type}
                            </span>
                            {t.reward > 0 && (
                              <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded bg-amber-100 text-amber-800">
                                <DollarSign className="h-3 w-3" />
                                {t.reward} SOL
                              </span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="text-gray-400 ml-2" />
                      </div>
                      
                      <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                        {t.description || "No description provided"}
                      </p>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(t.createdAt).toLocaleDateString()}
                        </div>
                        {t.escrowAddress && (
                          <div className="flex items-center gap-1 text-emerald-600">
                            <ShieldCheck className="h-3 w-3" />
                            <span className="text-xs">Escrow Ready</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  /* -------------------------------------------------------------------------- */
  /* VIEW 2: SUBMISSIONS LIST */
  /* -------------------------------------------------------------------------- */

  if (selectedTask && !selectedSub) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-8 min-h-screen bg-gradient-to-b from-teal-50 via-white to-teal-50/30"
      >
        <div className="max-w-6xl mx-auto">
          <motion.div
            whileHover={{ x: -4 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              variant="ghost"
              onClick={() => setSelectedTask(null)}
              className="mb-6 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Tasks
            </Button>
          </motion.div>

          <motion.div
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-teal-600 to-cyan-600 flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Submissions for <span className="text-teal-600">{selectedTask.form?.title}</span>
                </h1>
                <p className="text-gray-600 mt-1">
                  {selectedTask.submissions.length} submission(s)
                </p>
              </div>
            </div>
          </motion.div>

          {selectedTask.submissions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <div className="max-w-md mx-auto">
                <div className="h-20 w-20 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-10 w-10 text-teal-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Submissions Yet</h3>
                <p className="text-gray-600">No one has submitted responses to this task yet.</p>
              </div>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {selectedTask.submissions.map((s, index) => (
                <motion.div
                  key={s._id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ x: 4 }}
                  onClick={() => setSelectedSub(s)}
                  className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-teal-100 to-cyan-100 flex items-center justify-center font-bold text-teal-700">
                        {s.userId?.name?.charAt(0).toUpperCase() || "A"}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{s.userId?.name || "Anonymous"}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {s.userId?.email || "No email"}
                          </p>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(s.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${s.verification?.passed ? 'bg-emerald-100' : 'bg-red-100'}`}>
                        {s.verification?.passed ? (
                          <CheckCircle className="h-5 w-5 text-emerald-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  /* -------------------------------------------------------------------------- */
  /* VIEW 3: DETAILED REVIEW */
  /* -------------------------------------------------------------------------- */

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-8 min-h-screen bg-gradient-to-b from-teal-50 via-white to-teal-50/30"
    >
      <div className="max-w-7xl mx-auto">
        <motion.div
          whileHover={{ x: -4 }}
          whileTap={{ scale: 0.98 }}
          className="mb-6"
        >
          <Button
            variant="ghost"
            onClick={() => setSelectedSub(null)}
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Submissions
          </Button>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* ANSWERS */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
            >
              <Card className="border-gray-200 bg-white/90 backdrop-blur-sm shadow-xl">
                <CardHeader className="pb-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl text-gray-900">User Responses</CardTitle>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{selectedSub.userId?.name || "Anonymous"}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  {selectedTask.form.questions.map((q, index) => {
                    const qId = String(q._id);
                    const ans = selectedSub.answers.find(
                      (a) => String(a.questionId) === qId
                    );

                    return (
                      <motion.div
                        key={qId}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="space-y-3"
                      >
                        <div className="flex items-start gap-3">
                          <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold text-teal-700">{index + 1}</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-700 mb-1">{q.label}</p>
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                              {ans?.value ? (
                                <p className="text-gray-800">{ans.value}</p>
                              ) : (
                                <span className="italic text-gray-500">
                                  No answer provided
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {q.required && (
                          <div className="flex items-center gap-2 text-xs text-gray-500 ml-11">
                            <div className="h-1.5 w-1.5 rounded-full bg-teal-500"></div>
                            Required field
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* REVIEW & PAYOUT */}
          <div className="space-y-6">
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="border-gray-200 bg-white/90 backdrop-blur-sm shadow-xl">
                <CardHeader className="pb-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-teal-600 to-cyan-600 flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-white" />
                    </div>
                    <CardTitle className="text-xl text-gray-900">Review & Payout</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className={selectedSub.verification?.passed ? "text-emerald-600" : "text-red-600"} />
                        <span className="font-bold text-sm">
                          {selectedSub.verification?.passed ? "Security Passed" : "Security Flagged"}
                        </span>
                      </div>
                      
                    </div>

                    {selectedTask.form.reward > 0 && (
                      <div className="p-4 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">Reward Amount</span>
                          <span className="text-xl font-bold text-amber-700">{selectedTask.form.reward} SOL</span>
                        </div>
                        
                      </div>
                    )}

                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 disabled:opacity-70 disabled:cursor-not-allowed"
                        onClick={() => handleReleasePayment(selectedSub)}
                        disabled={
                          !selectedSub.verification?.passed ||
                          loading ||
                          paidSubmissions.has(selectedSub._id) ||
                          !wallet.connected
                        }
                      >
                        <Wallet className="h-5 w-5 mr-2" />
                        {loading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Processing...
                          </>
                        ) : paidSubmissions.has(selectedSub._id) ? (
                          "Payment Completed"
                        ) : wallet.connected ? (
                          `Release ${selectedTask.form.reward} SOL`
                        ) : (
                          "Connect Wallet First"
                        )}
                      </Button>
                    </motion.div>

                    {!selectedSub.verification?.passed && (
                      <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        <span>Payment disabled due to failed verification</span>
                      </div>
                    )}

                    {!wallet.connected && (
                      <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                        <Wallet className="h-4 w-4 flex-shrink-0" />
                        <span>Connect your Organisation wallet to release payments</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>


          </div>
        </div>
      </div>
    </motion.div>
  );
}