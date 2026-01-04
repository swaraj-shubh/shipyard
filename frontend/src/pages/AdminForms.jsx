import { useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import axios from "axios";
import { createEscrow } from "../../solana/createEscrow";

export default function AdminCreateTask() {
  const [title, setTitle] = useState("");
  const [reward, setReward] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const wallet = useWallet();
  const { connection } = useConnection();

  const createTask = async () => {
    if (!title.trim()) {
      alert("Please enter a task title");
      return;
    }

    if (reward > 0 && !wallet.connected) {
      alert("Please connect your wallet for paid tasks");
      return;
    }

    setIsSubmitting(true);

    try {
      let escrowAddress = null;

      /* ---------------- PAID TASK FLOW ---------------- */
      if (reward > 0) {
        console.log("🔔 Paid task detected, opening Phantom…");

        const res = await createEscrow({
          wallet,
          connection,
          rewardSOL: reward,
        });

        escrowAddress = res.escrowAddress;
      }

      /* ---------------- BACKEND SYNC ---------------- */
      await axios.post("/api/task/create", {
        title,
        reward,
        escrowAddress,
        organiser: wallet.publicKey?.toBase58() || null,
      });

      alert("✅ Task created successfully!");
      setTitle("");
      setReward(0);
    } catch (err) {
      console.error("Create task error:", err);
      alert(err.message || "Task creation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 space-y-5 bg-slate-800 rounded-xl shadow-lg">
      <h2 className="text-xl font-semibold text-white">
        Create New Task
      </h2>

      {/* 🔐 WALLET CONNECT */}
      <WalletMultiButton className="w-full justify-center" />

      {/* 📝 TITLE */}
      <input
        className="block w-full p-2 bg-slate-700 text-white rounded"
        placeholder="Task title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      {/* 💰 REWARD */}
      <input
        className="block w-full p-2 bg-slate-700 text-white rounded"
        type="number"
        step="0.1"
        min="0"
        placeholder="Reward in SOL (0 = free)"
        value={reward}
        onChange={(e) => setReward(Number(e.target.value))}
      />

      {/* ℹ️ INFO */}
      {reward > 0 && (
        <p className="text-sm text-yellow-400">
          Paid task → Phantom wallet will open to lock funds in escrow
        </p>
      )}

      {/* 🚀 SUBMIT */}
      <button
        className={`w-full px-4 py-2 rounded text-white ${
          isSubmitting
            ? "bg-gray-500"
            : "bg-indigo-600 hover:bg-indigo-500"
        }`}
        onClick={createTask}
        disabled={isSubmitting}
      >
        {isSubmitting ? "Processing…" : "Create Task"}
      </button>
    </div>
  );
}
