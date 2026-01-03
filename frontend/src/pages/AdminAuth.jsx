import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Wallet, Loader2, AlertCircle } from "lucide-react";
import bs58 from "bs58";

const AdminAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const navigate = useNavigate();

  const BASE_URL =
    import.meta.env.VITE_BACKEND_API || "http://localhost:5000/api";

  // 🔐 Connect Phantom Wallet
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

  // 🔑 Wallet Login (Nonce + Signature)
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const publicKey = walletAddress || (await connectWallet());
      if (!publicKey) return;

      // 1️⃣ Request nonce
      const nonceRes = await fetch(
        `${BASE_URL}/admin/login/request-nonce`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ solanaPublicKey: publicKey }),
        }
      );

      const nonceData = await nonceRes.json();
      if (!nonceRes.ok) throw new Error(nonceData.message);

      // 2️⃣ Sign nonce
      const encoded = new TextEncoder().encode(nonceData.nonce);
      const signed = await window.solana.signMessage(encoded);

      // 3️⃣ Verify signature
      const verifyRes = await fetch(
        `${BASE_URL}/admin/login/verify`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            solanaPublicKey: publicKey,
            signature: bs58.encode(signed.signature),
          }),
        }
      );

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData.message);

      localStorage.setItem("adminToken", verifyData.token);
      localStorage.setItem("role", "admin");

      navigate("/admin/dashboard");
    } catch (err) {
      setError(err.message || "Admin login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gray-800 p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-gray-700 p-3 rounded-full">
              <ShieldCheck className="text-green-400" size={32} />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            Admin Wallet Login
          </h2>
          <p className="text-gray-400">
            Secure wallet-based admin access
          </p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg flex gap-2 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <button
              type="button"
              onClick={connectWallet}
              className="w-full flex items-center justify-center gap-2 border py-3 rounded-lg"
            >
              <Wallet size={18} />
              {walletAddress
                ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
                : "Connect Phantom Wallet"}
            </button>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3 rounded-lg flex justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Verifying...
                </>
              ) : (
                "Access Admin Dashboard"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminAuth;
