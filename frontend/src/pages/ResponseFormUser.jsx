import { useEffect, useState } from "react";
import axios from "axios";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const API_BASE = import.meta.env.VITE_BACKEND_API;

export default function ResponseFormUser() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMySubmissions = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await axios.get(
          `${API_BASE}/form-responses/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setSubmissions(res.data);
      } catch (err) {
        alert("Failed to load submissions");
      } finally {
        setLoading(false);
      }
    };

    fetchMySubmissions();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading submissions...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <h1 className="text-3xl font-bold mb-6">My Submissions</h1>

      {submissions.length === 0 && (
        <p className="text-slate-400">You have not submitted any forms yet</p>
      )}

      <div className="space-y-4">
        {submissions.map((sub) => (
          <Card
            key={sub._id}
            className="bg-slate-900 border border-slate-700"
          >
            <CardHeader>
              <CardTitle>{sub.formId?.title}</CardTitle>
              <p className="text-sm text-slate-400">
                {sub.formId?.type}
              </p>
            </CardHeader>

            <CardContent className="space-y-2">
              {sub.answers.map((ans, i) => (
                <div key={i}>
                  <p className="text-sm text-slate-400">
                    Question ID: {ans.questionId}
                  </p>
                  <p className="break-all">
                    {Array.isArray(ans.value)
                      ? ans.value.join(", ")
                      : ans.value}
                  </p>
                </div>
              ))}

              <p className="text-xs text-slate-500 mt-2">
                Submitted at: {new Date(sub.createdAt).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
