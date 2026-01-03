import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wallet, Loader2, AlertCircle } from "lucide-react";

const AdminRegister = () => {
  const navigate = useNavigate();
  const BASE_URL =
    import.meta.env.VITE_BACKEND_API || "http://localhost:5000/api";

  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });

  const [walletAddress, setWalletAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 🔐 Connect Wallet
  const connectWallet = async () => {
    try {
      if (!window.solana || !window.solana.isPhantom) {
        throw new Error("Phantom wallet not found");
      }
      const res = await window.solana.connect();
      setWalletAddress(res.publicKey.toBase58());
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.name || !walletAddress) {
      setError("Name and wallet connection are required");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${BASE_URL}/admin/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          solanaPublicKey: walletAddress,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      localStorage.setItem("adminToken", data.token);
      localStorage.setItem("role", "admin");

      navigate("/admin/dashboard");
    } catch (err) {
      setError(err.message || "Admin registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-2xl font-bold text-center mb-6">
          Admin Wallet Registration
        </h2>

        {error && (
          <div className="mb-4 text-red-600 text-sm flex gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Admin Name"
            className="w-full border px-3 py-2 rounded"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
          />

          <input
            type="email"
            placeholder="Email (optional)"
            className="w-full border px-3 py-2 rounded"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />

          <button
            type="button"
            onClick={connectWallet}
            className="w-full flex items-center justify-center gap-2 border py-2 rounded"
          >
            <Wallet size={18} />
            {walletAddress
              ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
              : "Connect Phantom Wallet"}
          </button>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded flex justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Registering...
              </>
            ) : (
              "Register Admin"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminRegister;
