// src/pages/NotFound.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, AlertCircle } from "lucide-react";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
      <div className="max-w-md w-full text-center">
        {/* Animated 404 Number */}
        <div className="relative mb-8">
          <div className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-500 to-pink-500 animate-pulse">
            404
          </div>
          <div className="absolute inset-0 text-9xl font-bold text-white/10 blur-xl">
            404
          </div>
          <div className="absolute -top-4 -right-4">
            <AlertCircle className="w-12 h-12 text-yellow-500 animate-bounce" />
          </div>
        </div>

        {/* Error Message */}
        <h1 className="text-3xl font-bold text-white mb-4">
          Page Not Found
        </h1>
        
        <p className="text-slate-300 mb-6 text-lg">
          Oops! The page you're looking for seems to have disappeared into the quantum void.
        </p>

        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 mb-8">
          <p className="text-slate-400 mb-4">
            This could be because:
          </p>
          <ul className="text-left text-slate-300 space-y-2">
            <li className="flex items-center">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-3 animate-pulse"></div>
              The page has been moved or deleted
            </li>
            <li className="flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3 animate-pulse"></div>
              You typed the wrong URL
            </li>
            <li className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-3 animate-pulse"></div>
              The link you followed is broken
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="bg-slate-800 hover:bg-slate-700 text-white border-slate-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
          
          <Button
            onClick={() => navigate("/")}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            <Home className="w-4 h-4 mr-2" />
            Return Home
          </Button>
        </div>

        {/* Tech Info (Optional) */}
        <div className="mt-12 pt-6 border-t border-slate-700">
          <p className="text-sm text-slate-500">
            Error Code: 404 • Quantum Route Not Found
          </p>
          <p className="text-xs text-slate-600 mt-2">
            If you believe this is an error, contact support@securechat.com
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;