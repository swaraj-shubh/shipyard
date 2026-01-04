import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wallet, Loader2, AlertCircle, User, Mail, Shield, Key, ArrowRight, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

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
      setError("");
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
      window.location.reload();
    } catch (err) {
      setError(err.message || "Admin registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex items-center justify-center bg-gradient-to-b from-teal-50 via-white to-teal-50/30 p-4"
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-900 to-black p-8 text-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center"
            >
              <div className="h-16 w-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center mb-4">
                <Key className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">
                Organisation Registration
              </h2>
              <p className="text-gray-300">
                Register as an Organisator with wallet authentication
              </p>
            </motion.div>
          </div>

          {/* Body */}
          <div className="p-8">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg flex gap-3 items-start"
              >
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <span className="text-sm font-medium">{error}</span>
              </motion.div>
            )}

            {/* Info Card */}
            

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name Field */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-cyan-500/5 rounded-lg transform group-hover:scale-[1.02] transition-transform"></div>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Organisation Name *"
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 focus:outline-none transition-colors"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              {/* Email Field */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-cyan-500/5 rounded-lg transform group-hover:scale-[1.02] transition-transform"></div>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="email"
                    placeholder="Email (optional)"
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 focus:outline-none transition-colors"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Wallet Connection */}
              <div className="space-y-3">
                

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <button
                    type="button"
                    onClick={connectWallet}
                    className="w-full flex items-center justify-center gap-3 border-2 border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-700 py-3.5 rounded-lg transition-colors group"
                  >
                    <Wallet className="h-5 w-5 text-teal-600" />
                    <span className="font-medium">
                      {walletAddress
                        ? `${walletAddress.slice(0, 8)}...${walletAddress.slice(-6)}`
                        : "Connect Phantom Wallet"}
                    </span>
                    {walletAddress && (
                      <CheckCircle className="h-4 w-4 text-emerald-600 ml-1" />
                    )}
                  </button>
                </motion.div>

                {walletAddress && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-3 rounded-lg bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-100"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                        <Wallet className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-emerald-800 mb-1">Wallet Connected</p>
                        <p className="text-xs font-mono text-emerald-600 truncate">
                          {walletAddress}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Submit Button */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="pt-4"
              >
                <button
                  type="submit"
                  disabled={loading || !walletAddress || !formData.name}
                  className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white py-3.5 rounded-lg font-medium transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 group"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Registering Organisation...
                    </>
                  ) : (
                    <>
                      Register Organisation Account
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </motion.div>
            </form>

            {/* Security Note */}
          
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AdminRegister;
