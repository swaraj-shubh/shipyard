import { useEffect, useState } from "react";
import { ShieldCheck, Wallet, Mail, Loader2, AlertCircle } from "lucide-react";

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
        setError(err.message || "Failed to load admin profile");
      } finally {
        setLoading(false);
      }
    };

    fetchAdminProfile();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600 gap-2">
        <AlertCircle size={18} />
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center p-6">
      <div className="w-full max-w-xl bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gray-900 p-6 text-center">
          <div className="flex justify-center mb-3">
            <div className="bg-gray-700 p-3 rounded-full">
              <ShieldCheck className="text-green-400" size={28} />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white">Admin Profile</h2>
          <p className="text-gray-400 text-sm">Wallet-verified administrator</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Wallet className="text-gray-500" size={18} />
            <span className="text-sm font-mono break-all">
              {admin.solanaPublicKey}
            </span>
          </div>

          {admin.email && (
            <div className="flex items-center gap-3">
              <Mail className="text-gray-500" size={18} />
              <span className="text-sm">{admin.email}</span>
            </div>
          )}

          <div className="flex items-center gap-3">
            <ShieldCheck className="text-gray-500" size={18} />
            <span className="text-sm">
              Role: <strong>Admin</strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <ShieldCheck className="text-gray-500" size={18} />
            <span className="text-sm">
              Super Admin:{" "}
              <strong>{admin.superAdmin ? "Yes" : "No"}</strong>
            </span>
          </div>

          <div className="pt-4 border-t text-xs text-gray-500">
            Account created: {new Date(admin.createdAt).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile;
