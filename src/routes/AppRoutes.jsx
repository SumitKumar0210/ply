import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";
import MainLayout from "../layouts/MainLayout";
import ProtectedRoute from "./ProtectedRoute";

import Login from "../pages/auth/Login";
import ForgotPassword from "../pages/auth/ForgotPassword";
import Dashboard from "../pages/dashboard/Dashboard";
import Settings from "../pages/settings/Settings";
import Users from "../pages/users/Users";
import Labours from "../pages/users/Labours";
import Customers from "../pages/Users/Customers";
import VendorDashboard from "../pages/Vendor/Dashboard/VendorDashboard";
import PurchaseOrder from "../pages/Vendor/PurchaseOrder/PurchaseOrder";
import Invoice from "../pages/Vendor/Invoice/Invoice";
import Payment from "../pages/Vendor/Payment/Payment";
import Ledger from "../pages/Vendor/Ledger/Ledger";
import CreateVendor from "../pages/Vendor/CreateVendor/CreateVendor";
import CreatePurchaseOrder from "../pages/Vendor/PurchaseOrder/CreatePurchaseOrder";

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
      <Route path="/users" element={<ProtectedRoute><MainLayout><Users /></MainLayout></ProtectedRoute>}/>
      <Route path="/customers" element={<ProtectedRoute><MainLayout><Customers /></MainLayout></ProtectedRoute>}/>
      <Route path="/labours" element={<ProtectedRoute><MainLayout><Labours /></MainLayout></ProtectedRoute>}/>
      {/* Vendor */}
      <Route path="/vendor/dashboard" element={<ProtectedRoute><MainLayout><VendorDashboard/></MainLayout></ProtectedRoute>}/>
      <Route path="/vendor/purchase-order" element={<ProtectedRoute><MainLayout><PurchaseOrder/></MainLayout></ProtectedRoute>}/>
      <Route path="/vendor/purchase-order/create" element={<ProtectedRoute><MainLayout><CreatePurchaseOrder/></MainLayout></ProtectedRoute>}/>
      <Route path="/vendor/invoice" element={<ProtectedRoute><MainLayout><Invoice/></MainLayout></ProtectedRoute>}/>
      <Route path="/vendor/payment" element={<ProtectedRoute><MainLayout><Payment/></MainLayout></ProtectedRoute>}/>
      <Route path="/vendor/ledger" element={<ProtectedRoute><MainLayout><Ledger/></MainLayout></ProtectedRoute>}/>
      <Route path="/vendor/create-vendor" element={<ProtectedRoute><MainLayout><CreateVendor/></MainLayout></ProtectedRoute>}/>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;
