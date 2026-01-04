import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { 
  Users, 
  ArrowLeft, 
  Mail, 
  Calendar, 
  ExternalLink, 
  CheckCircle2 
} from "lucide-react";

const API_BASE = "http://localhost:5000/api"; // Adjust to your backend URL

export default function ViewSubmissions() {
  const { formId } = useParams();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const token = localStorage.getItem("token"); // Assuming JWT auth
        const res = await axios.get(`${API_BASE}/form-responses/${formId}/responses`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // This maps to your controller's res.json(responses)
        setSubmissions(res.data);
      } catch (err) {
        setError("Could not load participants for this task.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [formId]);

  if (loading) return <div className="p-10 text-center text-slate-400">Loading participants...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft size={20} /> Back to Dashboard
          </button>
          <div className="text-right">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Users className="text-indigo-500" /> Task Submissions
            </h1>
            <p className="text-slate-400 mt-1">Total Participants: {submissions.length}</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Submissions Table/List */}
        <div className="grid gap-4">
          {submissions.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 p-12 text-center rounded-xl">
              <p className="text-slate-500">No one has filled this form yet.</p>
            </div>
          ) : (
            submissions.map((sub) => (
              <div 
                key={sub._id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-indigo-500/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-indigo-600/20 rounded-full flex items-center justify-center text-indigo-400 font-bold text-xl">
                    {sub.userId?.name?.charAt(0) || "U"}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{sub.userId?.name || "Anonymous User"}</h3>
                    <div className="flex flex-col sm:flex-row sm:gap-4 text-sm text-slate-400">
                      <span className="flex items-center gap-1">
                        <Mail size={14} /> {sub.userId?.email || "No email provided"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar size={14} /> {new Date(sub.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-green-500/10 text-green-400 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 border border-green-500/20">
                    <CheckCircle2 size={12} /> Submitted
                  </div>
                  
                  {/* Detailed View Button */}
                  <button 
                    onClick={() => navigate(`/admin/submission/${sub._id}`, { state: { submission: sub } })}
                    className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm transition flex items-center gap-2"
                  >
                    View Answers <ExternalLink size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}