import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Mail, Wallet, Calendar, LogOut, Copy, Shield } from "lucide-react";

const API_BASE = import.meta.env.VITE_BACKEND_API || "http://localhost:5000/api";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      const adminToken = localStorage.getItem("adminToken");
      
      if (!token) {
        setError("Not authenticated");
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get(`${API_BASE}/user/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setUser(res.data);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleCopyWallet = () => {
    if (user?.solanaPublicKey) {
      navigator.clipboard.writeText(user.solanaPublicKey);
      alert("Wallet address copied to clipboard!");
    }
  };

  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gradient-to-b from-teal-50 to-white flex items-center justify-center"
      >
        <div className="text-center space-y-4">
          <div className="h-12 w-12 border-4 border-teal-100 border-t-teal-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-800 font-medium">Loading your profile...</p>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-screen bg-gradient-to-b from-teal-50 to-white flex items-center justify-center px-4"
      >
        <Card className="w-full max-w-md border-red-200 bg-white shadow-lg">
          <CardContent className="pt-8 pb-8">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <Shield className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h3>
                <p className="text-gray-600">{error}</p>
              </div>
              <Button 
                onClick={() => window.location.href = "/auth"}
                className="bg-gray-900 hover:bg-black text-white mt-2"
              >
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-b from-teal-50 via-white to-teal-50/30 flex items-center justify-center px-4 py-8"
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg"
      >
        <Card className="border-gray-200 bg-white/90 backdrop-blur-sm shadow-2xl">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-teal-600 to-teal-800 flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl text-gray-900">User Profile</CardTitle>
                <p className="text-sm text-gray-500">Manage your account information</p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-2 space-y-6">
            <ProfileItem 
              icon={<User className="h-4 w-4" />}
              label="Name" 
              value={user.name}
              iconColor="text-teal-600"
            />
            
            <ProfileItem 
              icon={<Mail className="h-4 w-4" />}
              label="Email" 
              value={user.email}
              iconColor="text-teal-500"
            />
            
            <div>
              <ProfileItem 
                icon={<Wallet className="h-4 w-4" />}
                label="Solana Wallet"
                value={user.solanaPublicKey}
                mono
                iconColor="text-teal-700"
              />
              {user.solanaPublicKey && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyWallet}
                  className="mt-2 border-teal-200 text-teal-700 hover:bg-teal-50 hover:border-teal-300"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy Address
                </Button>
              )}
            </div>
            
            <ProfileItem 
              icon={<Calendar className="h-4 w-4" />}
              label="Joined"
              value={new Date(user.createdAt).toLocaleString()}
              iconColor="text-gray-700"
            />

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="pt-4 border-t border-gray-100"
            >
              <Button
                className="w-full bg-gray-900 hover:bg-black text-white"
                onClick={() => {
                  localStorage.removeItem("token");
                  window.location.href = "/auth";
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

function ProfileItem({ icon, label, value, mono = false, iconColor = "text-gray-500" }) {
  return (
    <motion.div 
      whileHover={{ x: 4 }}
      className="space-y-2 p-3 rounded-lg hover:bg-teal-50/50 transition-colors"
    >
      <div className="flex items-center gap-2">
        <div className={`${iconColor}`}>
          {icon}
        </div>
        <p className="text-sm font-medium text-gray-600">{label}</p>
      </div>
      <p className={`text-base text-gray-900 pl-6 ${mono ? "font-mono break-all text-sm" : ""}`}>
        {value || "-"}
      </p>
    </motion.div>
  );
}

<style jsx global>{`
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-5px); }
  }
  
  .animate-float {
    animation: float 3s ease-in-out infinite;
  }
`}</style>