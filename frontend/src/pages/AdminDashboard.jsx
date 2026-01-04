import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";

/* 🔗 Solana */
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { createEscrow } from "../../solana/createEscrow";

/* 🧩 UI */
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectContent,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { PlusCircle, FileText, Wallet, DollarSign, Trash2, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_BASE =
  import.meta.env.VITE_BACKEND_API || "http://localhost:5000/api";

const QUESTION_TYPES = [
  "text",
  "email",
  "number",
  "textarea",
  "select",
  "checkbox",
  "radio",
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const wallet = useWallet();
  const { connection } = useConnection();

  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [reward, setReward] = useState(0);

  const [formData, setFormData] = useState({
    title: "",
    type: "",
    description: "",
    questions: [],
  });

  /* ================= FETCH FORMS ================= */
  const fetchForms = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      const res = await axios.get(`${API_BASE}/forms/admin/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setForms(res.data);
    } catch {
      alert("Failed to fetch forms");
    }
  };

  useEffect(() => {
    fetchForms();
  }, []);

  /* ================= QUESTIONS ================= */
  const addQuestion = () => {
    setFormData((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          label: "",
          type: "text",
          required: false,
          options: [],
        },
      ],
    }));
  };

  const updateQuestion = (index, field, value) => {
    const updated = [...formData.questions];
    updated[index][field] = value;
    setFormData({ ...formData, questions: updated });
  };

  const addOption = (qIndex) => {
    const updated = [...formData.questions];
    updated[qIndex].options.push("");
    setFormData({ ...formData, questions: updated });
  };

  const updateOption = (qIndex, oIndex, value) => {
    const updated = [...formData.questions];
    updated[qIndex].options[oIndex] = value;
    setFormData({ ...formData, questions: updated });
  };

  const removeQuestion = (index) => {
    const updated = [...formData.questions];
    updated.splice(index, 1);
    setFormData({ ...formData, questions: updated });
  };

  /* ================= CREATE FORM + ESCROW ================= */
  const handleCreateForm = async () => {
    if (!formData.title || !formData.type || !formData.questions.length) {
      alert("Fill all required fields");
      return;
    }

    if (reward > 0 && !wallet.publicKey) {
      alert("Connect wallet before creating a paid task");
      return;
    }

    setLoading(true);

    const taskHash = `${wallet.publicKey?.toBase58()}-${formData.title}`;

    try {
      let escrowAddress = null;
      let txHash = null;

      if (reward > 0) {
        const res = await createEscrow({
          wallet,
          connection,
          rewardSOL: reward,
          taskHash,
        });

        escrowAddress = res.escrowAddress;
        txHash = res.txHash;
      }

      const token = localStorage.getItem("adminToken");

      await axios.post(
        `${API_BASE}/forms`,
        {
          ...formData,
          reward,
          escrowAddress,
          txHash,
          taskHash,
          organiser: wallet.publicKey?.toBase58() || null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("✅ Form + Escrow created successfully");
      // Reset form
      setFormData({
        title: "",
        type: "",
        description: "",
        questions: [],
      });
      setReward(0);
      fetchForms();
      navigate("/admin/form");
    } catch (err) {
      console.error(err);
      alert("Creation failed");
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-b from-teal-50 via-white to-teal-50/30 p-6 space-y-8"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Organisation Dashboard</h1>
              <p className="text-gray-600 mt-2">Create and manage tasks</p>
            </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <WalletMultiButton />
            </motion.div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="border-gray-200 bg-white/90 backdrop-blur-sm shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-teal-100 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-teal-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Forms</p>
                  <p className="text-2xl font-bold text-gray-900">{forms.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-gray-200 bg-white/90 backdrop-blur-sm shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Wallet Status</p>
                  <p className={`text-lg font-bold ${wallet.connected ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {wallet.connected ? 'Connected' : 'Not Connected'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-gray-200 bg-white/90 backdrop-blur-sm shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Rewards</p>
                  <p className="text-2xl font-bold text-gray-900">{reward > 0 ? `${reward} SOL` : 'None'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CREATE FORM CARD */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-gray-200 bg-white/90 backdrop-blur-sm shadow-xl">
            <CardHeader className="pb-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-teal-600 to-cyan-600 flex items-center justify-center">
                  <PlusCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl text-gray-900">Create New Task</CardTitle>
                  <p className="text-sm text-gray-600">Design a form for applicants</p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
              {/* Basic Info */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-gray-700 font-medium">Title<span className="text-red-500">*</span></Label>
                  <Input
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="border-gray-300 focus:border-teal-500 focus:ring-teal-200"
                    placeholder="e.g., Frontend Developer Internship"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700 font-medium">Type<span className="text-red-500">*</span></Label>
                  <Select
                    value={formData.type}
                    onValueChange={(val) =>
                      setFormData({ ...formData, type: val })
                    }
                  >
                    <SelectTrigger className="border-gray-300 focus:border-teal-500 focus:ring-teal-200">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="internship">Internship</SelectItem>
                      <SelectItem value="hackathon">Hackathon</SelectItem>
                      <SelectItem value="job">Job</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      description: e.target.value,
                    })
                  }
                  className="border-gray-300 focus:border-teal-500 focus:ring-teal-200 min-h-[100px]"
                  placeholder="Describe the task or opportunity..."
                />
              </div>

              {/* 💰 REWARD */}
              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">Reward (SOL)</Label>
                <div className="flex items-center gap-4">
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    value={reward? reward : ""}
                    onChange={(e) => setReward(Number(e.target.value))}
                    className="border-gray-300 focus:border-teal-500 focus:ring-teal-200 max-w-xs"
                    placeholder="0.00"
                  />
                  {reward > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 text-amber-800">
                      {/* <DollarSign className="h-4 w-4" /> */}
                      <span className="text-sm font-medium">{reward} SOL will be locked in escrow</span>
                    </div>
                  )}
                </div>
                {reward > 0 && !wallet.connected && (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                    <AlertCircle className="h-4 w-4" />
                    Connect wallet to create a paid task
                  </div>
                )}
              </div>

              {/* ================= QUESTIONS ================= */}
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <Label className="text-gray-700 font-medium text-lg">Questions</Label>
                  <span className="text-sm text-gray-500">{formData.questions.length} question(s)</span>
                </div>

                <div className="space-y-4">
                  {formData.questions.map((q, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center">
                            <span className="text-sm font-bold text-teal-700">{index + 1}</span>
                          </div>
                          <span className="text-sm font-medium text-gray-700">Question #{index + 1}</span>
                        </div>
                        <button
                          onClick={() => removeQuestion(index)}
                          className="h-8 w-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-sm text-gray-600">Question Label<span className="text-red-500">*</span></Label>
                          <Input
                            placeholder="e.g., What's your experience level?"
                            value={q.label}
                            onChange={(e) =>
                              updateQuestion(index, "label", e.target.value)
                            }
                            className="border-gray-300 focus:border-teal-500 focus:ring-teal-200"
                          />
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm text-gray-600">Question Type</Label>
                            <Select
                              value={q.type}
                              onValueChange={(val) =>
                                updateQuestion(index, "type", val)
                              }
                            >
                              <SelectTrigger className="border-gray-300 focus:border-teal-500 focus:ring-teal-200">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {QUESTION_TYPES.map((t) => (
                                  <SelectItem key={t} value={t}>
                                    {t.charAt(0).toUpperCase() + t.slice(1)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex items-center justify-center h-full">
                            <label className="flex items-center gap-3 cursor-pointer">
                              <div className="relative">
                                <input
                                  type="checkbox"
                                  checked={q.required}
                                  onChange={(e) =>
                                    updateQuestion(
                                      index,
                                      "required",
                                      e.target.checked
                                    )
                                  }
                                  className="sr-only"
                                />
                                <div className={`h-6 w-11 rounded-full transition-colors ${q.required ? 'bg-teal-500' : 'bg-gray-300'}`}>
                                  <div className={`h-5 w-5 rounded-full bg-white transform transition-transform ${q.required ? 'translate-x-6' : 'translate-x-1'} mt-0.5`} />
                                </div>
                              </div>
                              <span className="text-sm font-medium text-gray-700">Required</span>
                            </label>
                          </div>
                        </div>

                        {(q.type === "select" ||
                          q.type === "checkbox" ||
                          q.type === "radio") && (
                          <div className="space-y-3 pt-4 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm text-gray-600">Options</Label>
                              <span className="text-xs text-gray-500">{q.options.length} option(s)</span>
                            </div>
                            <div className="space-y-2">
                              {q.options.map((opt, i) => (
                                <div key={i} className="flex items-center gap-2">
                                  <div className="h-6 w-6 rounded-full bg-gray-100 flex items-center justify-center">
                                    <span className="text-xs text-gray-600">{i + 1}</span>
                                  </div>
                                  <Input
                                    placeholder={`Option ${i + 1}`}
                                    value={opt}
                                    onChange={(e) =>
                                      updateOption(index, i, e.target.value)
                                    }
                                    className="border-gray-300 focus:border-teal-500 focus:ring-teal-200"
                                  />
                                </div>
                              ))}
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => addOption(index)}
                              className="border-teal-200 text-teal-700 hover:bg-teal-50"
                            >
                              + Add Option
                            </Button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant="outline"
                    onClick={addQuestion}
                    className="w-full border-dashed border-gray-300 text-gray-700 hover:border-teal-300 hover:bg-teal-50"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Question
                  </Button>
                </motion.div>
              </div>

              {/* Submit Button */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="pt-6 border-t border-gray-200"
              >
                <Button
                  onClick={handleCreateForm}
                  disabled={loading || !formData.title || !formData.type || !formData.questions.length || (reward > 0 && !wallet.connected)}
                  className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white py-6 text-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Creating Task...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Create Task Form
                    </>
                  )}
                </Button>
                {(!formData.title || !formData.type || !formData.questions.length) && (
                  <p className="text-sm text-red-600 text-center mt-2">
                    Please fill all required fields marked with *
                  </p>
                )}
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
