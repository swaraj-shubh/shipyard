import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const API_BASE = import.meta.env.VITE_BACKEND_API;

export default function AdminForms() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAdminForms = async () => {
      try {
        const token = localStorage.getItem("adminToken");

        if (!token) {
          alert("Admin not authenticated");
          return;
        }

        const res = await axios.get(
          `${API_BASE}/forms/admin/mine`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setForms(res.data);
      } catch (err) {
        console.error(err);
        alert("Failed to fetch admin forms");
      } finally {
        setLoading(false);
      }
    };

    fetchAdminForms();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading forms...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <h1 className="text-3xl font-bold mb-6">My Created Forms</h1>

      {forms.length === 0 && (
        <p className="text-slate-400">
          You haven’t created any forms yet.
        </p>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {forms.map((form) => (
          <Card
            key={form._id}
            className="bg-slate-900 border border-slate-700 hover:border-indigo-500 transition cursor-pointer"
            onClick={() =>
              navigate(`/admin/form/${form._id}/responses`)
            }
          >
            <CardHeader>
              <CardTitle className="text-lg">
                {form.title}
              </CardTitle>
              <p className="text-sm text-slate-400">
                {form.type}
              </p>
            </CardHeader>

            <CardContent className="space-y-2">
              <p className="text-sm text-slate-300 line-clamp-3">
                {form.description || "No description provided"}
              </p>

              <p className="text-xs text-slate-500">
                Questions: {form.questions.length}
              </p>

              <Button
                variant="secondary"
                className="w-full mt-2"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/admin/form/${form._id}/responses`);
                }}
              >
                View Responses
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
