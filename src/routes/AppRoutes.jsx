import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";
import MainLayout from "../layouts/MainLayout";
import ProtectedRoute from "./ProtectedRoute";

import Login from "../pages/auth/Login";
import ForgotPassword from "../pages/auth/ForgotPassword";
import Dashboard from "../pages/dashboard/Dashboard";
import Settings from "../pages/settings/Settings";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Default → Login */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      {/* Auth pages */}
      <Route path="/login" element={<AuthLayout><Login /></AuthLayout>}/>
      <Route path="/forgot-password" element={<AuthLayout><ForgotPassword /></AuthLayout>}/>
      {/* Protected pages */}
      <Route path="/dashboard" element={<ProtectedRoute><MainLayout><Dashboard /></MainLayout></ProtectedRoute>}/>
      <Route path="/settings" element={<ProtectedRoute><MainLayout><Settings /></MainLayout></ProtectedRoute>}/>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;
