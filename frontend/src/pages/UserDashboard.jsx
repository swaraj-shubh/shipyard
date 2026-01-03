import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const API_BASE = "http://localhost:5000/api";

export default function UserDashboard() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await axios.get(`${API_BASE}/forms`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setForms(res.data);
      } catch (err) {
        // alert("Failed to load tasks");
      } finally {
        setLoading(false);
      }
    };

    fetchForms();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading tasks...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <h1 className="text-3xl font-bold mb-6">Available Tasks</h1>

      {forms.length === 0 && (
        <p className="text-slate-400">No tasks available right now</p>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {forms.map((form) => (
          <Card
            key={form._id}
            className="bg-slate-900 border border-slate-700"
          >
            <CardHeader>
              <CardTitle>{form.title}</CardTitle>
              <p className="text-sm text-slate-400">{form.type}</p>
            </CardHeader>

            <CardContent className="space-y-3">
              <p className="text-sm text-slate-300">
                {form.description || "No description"}
              </p>

              <Button
                className="w-full bg-indigo-600 hover:bg-indigo-500"
                onClick={() => navigate(`/form/${form._id}`)}
              >
                Apply / Fill Form
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
