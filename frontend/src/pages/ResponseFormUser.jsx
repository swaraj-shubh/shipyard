import { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FileText, Calendar, Clock, CheckCircle, AlertCircle, Eye, Download } from "lucide-react";

const API_BASE = import.meta.env.VITE_BACKEND_API;

export default function ResponseFormUser() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMySubmissions = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE}/form-responses/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSubmissions(res.data);
        console.log('Submissions:', res.data);
      } catch (err) {
        console.error("Failed to load submissions");
      } finally {
        setLoading(false);
      }
    };

    fetchMySubmissions();
  }, []);

  const getStatusColor = (verification) => {
    if (!verification) return { bg: "bg-gray-100", text: "text-gray-700", icon: Clock };
    if (verification.passed) return { bg: "bg-green-100", text: "text-green-700", icon: CheckCircle };
    return { bg: "bg-amber-100", text: "text-amber-700", icon: AlertCircle };
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
          <p className="text-gray-800 font-medium">Loading your submissions...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-b from-teal-50 via-white to-teal-50/30 p-6"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-teal-600 to-teal-800 flex items-center justify-center">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">My Submissions</h1>
              <p className="text-gray-600">Review your submitted forms and verification status</p>
            </div>
          </div>
          
          {/* Stats */}
          <div className="flex items-center gap-4 mt-6">
            <div className="px-4 py-3 bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-teal-600" />
                <span className="text-sm text-gray-600">Total Submissions</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-1">{submissions.length}</p>
            </div>
            
            <div className="px-4 py-3 bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm text-gray-600">Verified</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {submissions.filter(s => s.verification?.passed).length}
              </p>
            </div>
          </div>
        </motion.div>

        {/* No submissions message */}
        {submissions.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="max-w-md mx-auto">
              <div className="h-20 w-20 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-6">
                <FileText className="h-10 w-10 text-teal-600" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">No Submissions Yet</h3>
              <p className="text-gray-600 mb-6">
                You haven't submitted any forms yet. Browse available tasks to get started!
              </p>
              <button
                onClick={() => window.location.href = "/user-dashboard"}
                className="px-6 py-3 bg-gray-900 hover:bg-black text-white rounded-lg font-medium transition-colors"
              >
                Browse Available Tasks
              </button>
            </div>
          </motion.div>
        )}

        {/* Submissions List */}
        <div className="space-y-6">
          {submissions.map((sub, index) => {
            const status = getStatusColor(sub.verification);
            const StatusIcon = status.icon;
            
            return (
              <motion.div
                key={sub._id}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border-gray-200 bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <CardHeader className="pb-4">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h2 className="text-xl font-bold text-gray-900">{sub.formId?.title}</h2>
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${status.bg} ${status.text}`}>
                            <StatusIcon className="h-3 w-3 inline mr-1" />
                            {sub.verification?.passed ? 'Verified' : 
                             sub.verification ? 'Under Review' : 'Pending'}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <div className="px-2 py-1 text-xs font-medium rounded bg-teal-100 text-teal-800">
                              {sub.formId?.type || 'Unknown Type'}
                            </div>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(sub.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          
                          
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Submitted: {new Date(sub.createdAt).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-2">
                    {/* Answers Section */}
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Your Answers
                      </h3>
                      <div className="space-y-4">
                        {sub.answers.map((ans, i) => (
                          <motion.div
                            key={i}
                            whileHover={{ x: 4 }}
                            className="p-4 rounded-lg border border-gray-200 bg-gray-50/50"
                          >
                            <div className="flex items-start gap-3">
                              <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-sm font-bold text-teal-700">{i + 1}</span>
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-600 mb-1">
                                  Question ID: <span className="font-mono text-xs">{ans.questionId}</span>
                                </p>
                                <div className="p-3 bg-white rounded border border-gray-200">
                                  <p className="text-gray-800">
                                    {Array.isArray(ans.value)
                                      ? ans.value.map((item, idx) => (
                                          <span key={idx} className="inline-block mr-2 mb-1 px-2 py-1 bg-teal-50 text-teal-700 rounded text-sm">
                                            {item}
                                          </span>
                                        ))
                                      : ans.value}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="text-sm text-gray-500">
                          <p>
                            Last updated: {new Date(sub.updatedAt).toLocaleString()}
                          </p>
                          <p className="text-xs mt-1">
                            Submission ID: <span className="font-mono">{sub._id}</span>
                          </p>
                        </div>
                        
                        <button
                          onClick={() => {
                            // Function to download submission data
                            const dataStr = JSON.stringify(sub, null, 2);
                            const dataBlob = new Blob([dataStr], { type: 'application/json' });
                            const url = URL.createObjectURL(dataBlob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = `submission-${sub.formId?.title || 'form'}-${new Date(sub.createdAt).toISOString().split('T')[0]}.json`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            URL.revokeObjectURL(url);
                          }}
                          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          <Download className="h-4 w-4" />
                          Export Data
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      <style jsx global>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </motion.div>
  );
}
