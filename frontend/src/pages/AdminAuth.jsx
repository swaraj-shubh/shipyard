import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Wallet, Loader2, AlertCircle, Lock, ArrowRight, Key } from "lucide-react";
import bs58 from "bs58";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { motion } from "framer-motion";

const AdminAuth = () => {
  const { publicKey, signMessage, connected } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const BASE_URL =
    import.meta.env.VITE_BACKEND_API || "http://localhost:5000/api";

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!connected || !publicKey) {
        throw new Error("Please connect Phantom wallet");
      }

      const walletAddress = publicKey.toBase58();

      // 1️⃣ Request nonce
      const nonceRes = await fetch(
        `${BASE_URL}/admin/login/request-nonce`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ solanaPublicKey: walletAddress }),
        }
      );

      const nonceData = await nonceRes.json();
      if (!nonceRes.ok) throw new Error(nonceData.message);

      // 2️⃣ Sign nonce
      const encoded = new TextEncoder().encode(nonceData.nonce);
      const signature = await signMessage(encoded);

      // 3️⃣ Verify signature
      const verifyRes = await fetch(
        `${BASE_URL}/admin/login/verify`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            solanaPublicKey: walletAddress,
            signature: bs58.encode(signature),
          }),
        }
      );

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData.message);

      localStorage.setItem("adminToken", verifyData.token);
      localStorage.setItem("role", "admin");

      navigate("/admin/dashboard");
      window.location.reload();
    } catch (err) {
      setError(err.message || "Admin login failed");
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
                <Lock className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">
                Admin Portal
              </h2>
              <p className="text-gray-300">
                Secure wallet-based administrator access
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
            

            {/* Wallet Connection */}
            <div className="mb-6">
              
              
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="mb-4"
              >
                <WalletMultiButton className="w-full" />
              </motion.div>

              {connected && publicKey && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center justify-center align-center gap-3 p-3 rounded-lg bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-100"
                >
                  <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Wallet className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-emerald-800 mb-1">Wallet Connected</p>
                    <p className="text-xs font-mono text-emerald-600 truncate">
                      {publicKey.toBase58()}
                    </p>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Admin Access Button */}
            <div className="mb-8">
              
              
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <button
                  onClick={handleLogin}
                  disabled={loading || !connected}
                  className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white py-3.5 rounded-lg font-medium transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 group"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Verifying Access...
                    </>
                  ) : (
                    <>
                      Access Organisation Dashboard
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </motion.div>
              
              <p className="text-xs text-gray-500 text-center mt-3">
                Requires signature verification for security
              </p>
            </div>


          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AdminAuth;