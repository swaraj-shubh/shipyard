import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, Loader2, AlertCircle, Wallet, ArrowRight, CheckCircle, Shield, Sparkles } from "lucide-react";
import bs58 from "bs58";
import { motion } from "framer-motion";

const UserAuth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [walletAddress, setWalletAddress] = useState("");

  const navigate = useNavigate();

  const BASE_URL = `${import.meta.env.VITE_BACKEND_API}/user`;

  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });

  // ---------------- Wallet Connect ----------------
  const connectWallet = async () => {
    try {
      if (!window.solana || !window.solana.isPhantom) {
        throw new Error("Phantom wallet not found");
      }

      const res = await window.solana.connect();
      const pubKey = res.publicKey.toBase58();
      setWalletAddress(pubKey);
      setError("");
      return pubKey;
    } catch (err) {
      setError(err.message || "Wallet connection failed");
      return null;
    }
  };

  // ---------------- REGISTER ----------------
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const publicKey = walletAddress || (await connectWallet());
      if (!publicKey) return;

      const res = await fetch(`${BASE_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          solanaPublicKey: publicKey,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      localStorage.setItem("token", data.token);
      localStorage.setItem("role", "user");

      navigate("/dashboard");
      window.location.reload();
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- LOGIN ----------------
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const publicKey = walletAddress || (await connectWallet());
      if (!publicKey) return;

      // 1️⃣ Request nonce
      const nonceRes = await fetch(`${BASE_URL}/login/request-nonce`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ solanaPublicKey: publicKey }),
      });

      const nonceData = await nonceRes.json();
      if (!nonceRes.ok) throw new Error(nonceData.message);

      // 2️⃣ Sign nonce
      const encoded = new TextEncoder().encode(nonceData.nonce);
      const signed = await window.solana.signMessage(encoded);

      // 3️⃣ Verify signature
      const verifyRes = await fetch(`${BASE_URL}/login/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          solanaPublicKey: publicKey,
          signature: bs58.encode(signed.signature),
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData.message);

      localStorage.setItem("token", verifyData.token);
      localStorage.setItem("role", "user");

      navigate("/dashboard");
      window.location.reload();
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- UI ----------------
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
          <div className="bg-gradient-to-r from-teal-600 to-cyan-600 p-8 text-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center"
            >
              <div className="h-16 w-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center mb-4">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">
                {isLogin ? "Welcome Back" : "Get Started"}
              </h2>
              <p className="text-teal-100">
                {isLogin
                  ? "Sign in with your Solana wallet"
                  : "Create your account in seconds"}
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

            <form
              onSubmit={isLogin ? handleLogin : handleRegister}
              className="space-y-5"
            >
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-cyan-500/5 rounded-lg transform group-hover:scale-[1.02] transition-transform"></div>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        required
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-cyan-500/5 rounded-lg transform group-hover:scale-[1.02] transition-transform"></div>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="email"
                        placeholder="Email (optional)"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

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

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-gray-900 to-black hover:from-gray-800 hover:to-gray-900 text-white py-3.5 rounded-lg font-medium transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3 group"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {isLogin ? "Login with Wallet" : "Register with Wallet"}
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </motion.div>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-200">
             

              <div className="text-center">
                <span className="text-sm text-gray-600">
                  {isLogin ? "New to the platform? " : "Already have an account? "}
                </span>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setIsLogin(!isLogin)}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-teal-600 hover:text-teal-700 cursor-pointer ml-1"
                >
                  {isLogin ? "Create account" : "Sign in instead"}
                  <Sparkles className="h-3 w-3" />
                </motion.button>
              </div>

            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default UserAuth;