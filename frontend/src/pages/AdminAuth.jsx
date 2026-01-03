import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';

const AdminAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // Handle Input Change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Backend URL (Based on index.js and adminAuth.routes.js)
    const BASE_URL = import.meta.env.VITE_BACKEND_API || 'http://localhost:5000/api';

    try {
      // Endpoint: /admin/login
      const response = await fetch(`${BASE_URL}/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Admin authentication failed');
      }

      // Success: Store token and admin data
      // Storing as 'adminToken' to avoid conflict with user 'token'
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('adminUser', JSON.stringify(data.admin));
      localStorage.setItem('role', 'admin');

      // Redirect to Admin Dashboard
      alert('Welcome, Administrator');
      navigate('/admin/dashboard'); 

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        
        {/* Header Section - Darker theme for Admin */}
        <div className="bg-gray-800 p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-gray-700 p-3 rounded-full">
              <ShieldCheck className="text-green-400" size={32} />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">
            Admin Portal
          </h2>
          <p className="text-gray-400">
            Secure access for system administrators
          </p>
        </div>

        {/* Form Section */}
        <div className="p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg flex items-center gap-2 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email Field */}
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 text-gray-500" size={20} />
              <input
                type="email"
                name="email"
                placeholder="Admin Email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent outline-none transition-all"
                required
              />
            </div>

            {/* Password Field */}
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 text-gray-500" size={20} />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent outline-none transition-all"
                required
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 mt-6"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Verifying...
                </>
              ) : (
                'Access Dashboard'
              )}
            </button>
          </form>

          {/* Footer Note */}
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Restricted Access Area</p>
            <p className="text-xs mt-1">IP addresses are monitored for security.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAuth;