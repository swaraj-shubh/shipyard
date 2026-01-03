import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, Loader2, AlertCircle, Wallet } from "lucide-react";
import bs58 from "bs58";

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
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- UI ----------------
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 p-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-2">
            {isLogin ? "Sign In with Wallet" : "Register with Wallet"}
          </h2>
          <p className="text-blue-100">
            {isLogin
              ? "Connect your wallet to continue"
              : "Connect wallet and complete registration"}
          </p>
        </div>

        {/* Body */}
        <div className="p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg flex gap-2 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <form
            onSubmit={isLogin ? handleLogin : handleRegister}
            className="space-y-4"
          >
            {!isLogin && (
              <>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    className="w-full pl-10 pr-4 py-3 border rounded-lg"
                  />
                </div>

                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 text-gray-400" size={20} />
                  <input
                    type="email"
                    placeholder="Email (optional)"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-3 border rounded-lg"
                  />
                </div>
              </>
            )}

            <button
              type="button"
              onClick={connectWallet}
              className="w-full flex items-center cursor-pointer justify-center gap-2 border py-3 rounded-lg"
            >
              <Wallet size={18} />
              {walletAddress
                ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
                : "Connect Phantom Wallet"}
            </button>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 cursor-pointer hover:bg-blue-700 text-white py-3 rounded-lg flex justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Processing...
                </>
              ) : isLogin ? (
                "Login with Wallet"
              ) : (
                "Register with Wallet"
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            {isLogin ? "New here? " : "Already registered? "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-600 cursor-pointer font-semibold hover:underline"
            >
              {isLogin ? "Create account" : "Login"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserAuth;
