import { useEffect, useState, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import ChatButton from "./components/ChatButton";
import ChatInterface from "./components/ChatInterface";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import { logout, getCurrentUser, isAuthenticated } from "./services/authService";

const PII_LABELS = {
  aadhaar:           "Aadhaar Number",
  pan:               "PAN Card",
  phone:             "Phone Number",
  email:             "Email Address",
  ifsc:              "IFSC Code",
  bankAccount:       "Bank Account Number",
  paymentCardNumber: "Payment Card Number",
};

const PII_ICONS = {
  aadhaar:           "🪪",
  pan:               "📋",
  phone:             "📱",
  email:             "✉️",
  ifsc:              "🏦",
  bankAccount:       "💳",
  paymentCardNumber: "💳",
};

const THEME_STORAGE_KEY = "pii_detector_theme";

function getInitialTheme() {
  if (typeof window === "undefined") {
    return "dark";
  }

  try {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (savedTheme === "dark" || savedTheme === "light") {
      return savedTheme;
    }
  } catch (_) {}

  if (window.matchMedia?.("(prefers-color-scheme: light)")?.matches) {
    return "light";
  }

  return "dark";
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected routes */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Redirect any unknown routes to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}
