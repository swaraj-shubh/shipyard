import { useEffect, useState } from "react";
import axios from "axios";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading profile...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-400">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <Card className="w-full max-w-lg bg-slate-900 border border-slate-700 text-white">
        <CardHeader>
          <CardTitle className="text-2xl">User Profile</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <ProfileItem label="Name" value={user.name} />
          <ProfileItem label="Email" value={user.email} />
          <ProfileItem
            label="Solana Wallet"
            value={user.solanaPublicKey}
            mono
          />
          <ProfileItem
            label="Joined"
            value={new Date(user.createdAt).toLocaleString()}
          />

          <Button
            variant="destructive"
            className="w-full mt-4"
            onClick={() => {
              localStorage.removeItem("token");
              window.location.href = "/auth";
            }}
          >
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function ProfileItem({ label, value, mono = false }) {
  return (
    <div>
      <p className="text-sm text-slate-400">{label}</p>
      <p className={`text-base ${mono ? "font-mono break-all" : ""}`}>
        {value || "-"}
      </p>
    </div>
  );
}
