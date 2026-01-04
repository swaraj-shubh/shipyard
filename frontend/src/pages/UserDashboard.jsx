import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Calendar, DollarSign, CheckCircle, Clock } from "lucide-react";

const API_BASE = import.meta.env.VITE_BACKEND_API;

export default function UserDashboard() {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [filteredForms, setFilteredForms] = useState([]);

  useEffect(() => {
    const fetchMySubmissions = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE}/form-responses/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSubmissions(res.data);
      } catch (err) {
        console.error("Failed to load submissions");
      }
    };

    fetchMySubmissions();
  }, []);

  useEffect(() => {
    const fetchForms = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE}/forms`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setForms(res.data);
      } catch (err) {
        console.error("Failed to load forms");
      } finally {
        setLoading(false);
      }
    };

    fetchForms();
  }, []);

  // Filter forms that are not in submissions
  useEffect(() => {
    if (forms.length > 0 && submissions.length > 0) {
      const submittedFormIds = submissions.map(sub => sub.formId._id);
      const availableForms = forms.filter(form => !submittedFormIds.includes(form._id));
      setFilteredForms(availableForms);
    } else if (forms.length > 0) {
      setFilteredForms(forms);
    }
  }, [forms, submissions]);

  if (loading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gradient-to-b from-teal-50 to-white flex items-center justify-center"
      >
        <div className="text-center space-y-4">
          <div className="h-12 w-12 border-4 border-teal-100 border-t-teal-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-800 font-medium">Loading tasks...</p>
        </div>
      </motion.div>
    );
  }

  const submittedCount = submissions.length;
  const availableCount = filteredForms.length;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-b from-teal-50 via-white to-teal-50/30 p-6"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Available Tasks</h1>
          <p className="text-gray-600">Complete tasks and earn rewards</p>
          
          {/* Stats */}
          <div className="flex flex-wrap gap-4 mt-6">
            <div className="px-4 py-3 bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-teal-600" />
                <span className="text-sm text-gray-600">Available Tasks</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-1">{availableCount}</p>
            </div>
            
            <div className="px-4 py-3 bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm text-gray-600">Submitted</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-1">{submittedCount}</p>
            </div>
          </div>
        </motion.div>

        {/* No tasks message */}
        {filteredForms.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <div className="max-w-md mx-auto">
              <div className="h-16 w-16 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-teal-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Available Tasks</h3>
              <p className="text-gray-600">
                {submittedCount > 0 
                  ? "You've already submitted all available forms. Check back later for new tasks!"
                  : "No tasks are currently available. Please check back soon!"}
              </p>
            </div>
          </motion.div>
        )}

        {/* Task Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredForms.map((form, index) => (
            <motion.div
              key={form._id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-gray-200 bg-white/90 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl text-gray-900">{form.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-1 text-xs font-medium rounded bg-teal-100 text-teal-800">
                          {form.type}
                        </span>
                        <span className="flex items-center gap-1 text-sm text-gray-500">
                          <Calendar className="h-3 w-3" />
                          {new Date(form.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {form.reward > 0 && (
                      <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-800">
                        <DollarSign className="h-4 w-4" />
                        <span className="font-bold">{form.reward}</span>
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="pt-2 space-y-4">
                  

                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      className="w-full bg-green-700 hover:bg-green-600 text-white"
                      onClick={() => navigate(`/form/${form._id}`)}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Apply / Fill Form
                    </Button>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Completed Tasks Section (Collapsible if you want) */}
        {submissions.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-12 pt-8 border-t border-gray-200"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Submissions</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {submissions.map((submission, index) => (
                <motion.div
                  key={submission._id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg text-gray-900">
                            {submission.formId.title}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800">
                              {submission.formId.type}
                            </span>
                            {submission.verification?.passed && (
                              <span className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded bg-teal-100 text-teal-800">
                                <CheckCircle className="h-3 w-3" />
                                Verified
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Submitted</p>
                          <p className="text-sm font-medium text-gray-900">
                            {new Date(submission.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-2">
                      {submission.verification && (
                        <div className="mb-4 p-3 bg-white rounded border border-green-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Verification Score</span>
                            <span className={`text-lg font-bold ${
                              submission.verification.netScore >= 80 ? 'text-green-600' :
                              submission.verification.netScore >= 60 ? 'text-amber-600' : 'text-red-600'
                            }`}>
                              {submission.verification.netScore}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                submission.verification.netScore >= 80 ? 'bg-green-500' :
                                submission.verification.netScore >= 60 ? 'bg-amber-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${submission.verification.netScore}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Status: {submission.verification.passed ? 'Passed ✓' : 'Review Required'}
                          </p>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        Last updated: {new Date(submission.updatedAt).toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      <style jsx global>{`
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </motion.div>
  );
}
