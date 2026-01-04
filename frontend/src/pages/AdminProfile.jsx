import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Wallet, Mail, Loader2, AlertCircle, User, Key, Calendar, Award, Lock, Database, Clock, Globe, Settings } from "lucide-react";

const AdminProfile = () => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const BASE_URL =
    import.meta.env.VITE_BACKEND_API || "http://localhost:5000/api";

  useEffect(() => {
    const fetchAdminProfile = async () => {
      try {
        const token = localStorage.getItem("adminToken");

        if (!token) {
          throw new Error("Admin not authenticated");
        }

        const res = await fetch(`${BASE_URL}/admin/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        setAdmin(data);
      } catch (err) {
        setError(err.message || "Failed to load organiser profile");
      } finally {
        setLoading(false);
      }
    };

    fetchAdminProfile();
  }, []);

  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-teal-50 to-white"
      >
        <div className="text-center space-y-4">
          <div className="h-12 w-12 border-4 border-teal-100 border-t-teal-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-800 font-medium">Loading organiser profile...</p>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="min-h-screen flex items-center justify-center px-4"
      >
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-red-200 overflow-hidden">
          <div className="bg-gradient-to-r from-red-500 to-red-600 p-12 text-center">
            <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Authentication Error</h2>
            <p className="text-red-100 text-lg">{error}</p>
          </div>
          <div className="p-8 text-center">
            <button
              onClick={() => window.location.href = "/admin/auth"}
              className="px-8 py-4 bg-gray-900 hover:bg-black text-white rounded-lg font-medium transition-colors text-lg"
            >
              Go to Organisation Login
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-b from-teal-50 via-white to-teal-50/30 p-4 md:p-8"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8 md:mb-12"
        >
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
              <Lock className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Organiser Profile</h1>
              <p className="text-gray-600 mt-2">Wallet-verified organiser account dashboard</p>
            </div>
          </div>
        </motion.div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
          {/* Left Column - Admin Information */}
          <div className="lg:col-span-2">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Admin Name Card */}
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                whileHover={{ y: -4 }}
                className="md:col-span-2"
              >
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-gray-900 to-black p-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                        <User className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">Organisator Details</h2>
                        <p className="text-gray-300">Personal information</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="h-4 w-4" />
                        <span>Full Name</span>
                      </div>
                      <p className="text-xl font-semibold text-gray-900">{admin.name}</p>
                    </div>

                    {admin.email && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Mail className="h-4 w-4" />
                          <span>Email Address</span>
                        </div>
                        <p className="text-lg font-medium text-gray-900">{admin.email}</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Wallet Address Card */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                whileHover={{ y: -4 }}
                className="md:col-span-2"
              >
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-teal-600 to-cyan-600 p-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                        <Wallet className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">Wallet Connection</h2>
                        <p className="text-teal-100">Solana blockchain identity</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                          <span className="text-sm font-medium text-emerald-600">Connected to Solana Mainnet</span>
                        </div>
                        <p className="font-mono text-sm text-gray-800 break-all">
                          {admin.solanaPublicKey}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <Globe className="h-4 w-4" />
                        <span>This address is permanently linked to your Organisation privileges</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>


            </div>
          </div>

          {/* Right Column - Account Details & Security */}
          <div className="space-y-6 md:space-y-8">
            {/* Account Information Card */}
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              whileHover={{ y: -4 }}
            >
              <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                      <Database className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">Account Information</h2>
                      <p className="text-blue-100">Profile details</p>
                    </div>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>Account Created</span>
                    </div>
                    <p className="font-medium text-gray-900">
                      {new Date(admin.createdAt).toLocaleDateString('en-US', { 
                        weekday: 'long',
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>Account Age</span>
                    </div>
                    <p className="font-medium text-gray-900">
                      {Math.floor((new Date() - new Date(admin.createdAt)) / (1000 * 60 * 60 * 24))} days
                    </p>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Status</span>
                      <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-medium">
                        Active
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>


          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminProfile;
