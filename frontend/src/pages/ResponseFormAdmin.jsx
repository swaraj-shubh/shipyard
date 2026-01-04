import { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const API_BASE = import.meta.env.VITE_BACKEND_API;

export default function ResponseFormAdmin() {
  const { formId } = useParams();
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResponses = async () => {
      try {
        const token = localStorage.getItem("adminToken");

        const res = await axios.get(
          `${API_BASE}/form-responses/${formId}/responses`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setResponses(res.data);
      } catch (err) {
        alert("Failed to load responses");
      } finally {
        setLoading(false);
      }
    };

    fetchResponses();
  }, [formId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Loading responses...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <h1 className="text-3xl font-bold mb-6">Form Responses</h1>

      {responses.length === 0 && (
        <p className="text-slate-400">No responses submitted yet</p>
      )}

      <div className="space-y-4">
        {responses.map((res, idx) => (
          <Card
            key={res._id}
            className="bg-slate-900 border border-slate-700"
          >
            <CardHeader>
              <CardTitle>
                #{idx + 1} — {res.userId?.name} ({res.userId?.email})
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-2">
              {res.answers.map((ans, i) => (
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
                Submitted at: {new Date(res.createdAt).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
