import { useEffect, useState } from "react";
import axios from "axios";

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

  /* ================= CREATE FORM + ESCROW ================= */
  /* Inside AdminDashboard.jsx -> handleCreateForm */

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
  } catch (err) {
    console.error(err);
    alert("Creation failed");
  } finally {
    setLoading(false);
  }
};


  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      {/* 🔐 WALLET */}
      <WalletMultiButton />

      {/* CREATE FORM */}
      <Card className="bg-slate-900 border border-slate-700">
        <CardHeader>
          <CardTitle>Create New Task / Form</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />
          </div>

          <div>
            <Label>Type</Label>
            <Select
              value={formData.type}
              onValueChange={(val) =>
                setFormData({ ...formData, type: val })
              }
            >
              <SelectTrigger>
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

          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  description: e.target.value,
                })
              }
            />
          </div>

          {/* 💰 REWARD */}
          <div>
            <Label>Reward (SOL)</Label>
            <Input
              type="number"
              min="0"
              step="0.1"
              value={reward}
              onChange={(e) => setReward(Number(e.target.value))}
            />
            {reward > 0 && (
              <p className="text-xs text-yellow-400 mt-1">
                Paid task → SOL locked in escrow
              </p>
            )}
          </div>

          {/* ================= QUESTIONS ================= */}
          <div className="space-y-4">
            <Label>Questions</Label>

            {formData.questions.map((q, index) => (
              <Card
                key={q.id}
                className="bg-slate-800 p-4 space-y-2"
              >
                <Input
                  placeholder="Question label"
                  value={q.label}
                  onChange={(e) =>
                    updateQuestion(index, "label", e.target.value)
                  }
                />

                <Select
                  value={q.type}
                  onValueChange={(val) =>
                    updateQuestion(index, "type", val)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {QUESTION_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <label className="flex gap-2 items-center text-sm">
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
                  />
                  Required
                </label>

                {(q.type === "select" ||
                  q.type === "checkbox" ||
                  q.type === "radio") && (
                  <div className="space-y-2">
                    {q.options.map((opt, i) => (
                      <Input
                        key={i}
                        placeholder={`Option ${i + 1}`}
                        value={opt}
                        onChange={(e) =>
                          updateOption(index, i, e.target.value)
                        }
                      />
                    ))}
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => addOption(index)}
                    >
                      + Add Option
                    </Button>
                  </div>
                )}
              </Card>
            ))}

            <Button variant="secondary" onClick={addQuestion}>
              + Add Question
            </Button>
          </div>

          <Button
            className="w-full bg-indigo-600"
            onClick={handleCreateForm}
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Form"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
