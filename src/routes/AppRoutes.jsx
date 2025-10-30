import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";
import MainLayout from "../layouts/MainLayout";
import ProtectedRoute from "./ProtectedRoute";

// Auth pages
import Login from "../pages/auth/Login";
import ForgotPassword from "../pages/auth/ForgotPassword";

// Main pages
import Dashboard from "../pages/dashboard/Dashboard";
import Settings from "../pages/settings/Settings";
import Users from "../pages/Users/Users";
import Customers from "../pages/Users/Customers";
import Labours from "../pages/Users/Labours";

// Vendor pages
import VendorDashboard from "../pages/Vendor/Dashboard/VendorDashboard";
import PurchaseOrder from "../pages/Vendor/PurchaseOrder/PurchaseOrder";
import CreatePurchaseOrder from "../pages/Vendor/PurchaseOrder/CreatePurchaseOrder";
import EditPurchaseOrder from "../pages/Vendor/PurchaseOrder/EditPurchaseOrder";
import ViewPurchaseOrder from "../pages/Vendor/PurchaseOrder/ViewPurchaseOrder";
import ApprovePurchaseOrder from "../pages/Vendor/PurchaseOrder/ApprovePurchaseOrder";
import PurchaseOrderQC from "../pages/Vendor/PurchaseOrder/PurchaseOrderQC";
import PrintPurchaseOrder from "../pages/Vendor/PurchaseOrder/PrintPurchaseOrder";

import VendorInvoice from "../pages/Vendor/Invoice/Invoice";
import InvoiceDetail from "../pages/Vendor/Invoice/InvoiceDetail";

import Payment from "../pages/Vendor/Payment/Payment";
import Ledger from "../pages/Vendor/Ledger/Ledger";
import CreateVendor from "../pages/Vendor/CreateVendor/CreateVendor";

import CustomerDashboard from "../pages/Customer/Dashboard/CustomerDashboard";
import Quote from "../pages/Customer/Quote/Quote";
import QuoteDetailsView from "../pages/Customer/Quote/QuoteDetailsView";
import CreateQuote from "../pages/Customer/Quote/CreateQuote";
import EditQuote from "../pages/Customer/Quote/EditQuote";
import Order from "../pages/Customer/Order/Order";
import OrderDetailsView from "../pages/Customer/Order/OrderDetailsView";
import CreateOrder from "../pages/Customer/Order/CreateOrder";
import EditOrder from "../pages/Customer/Order/EditOrder";
import CustomerLedger from "../pages/Customer/Ledger/Ledger";
import Vendor from "../pages/Vendor/Ledger/vendor";


import Error404 from "../pages/error/404";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Default → Login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Auth pages */}
      <Route path="/login" element={<AuthLayout><Login /></AuthLayout>} />
      <Route path="/forgot-password" element={<AuthLayout><ForgotPassword /></AuthLayout>} />

      {/* Protected pages */}
      <Route path="/dashboard" element={<ProtectedRoute><MainLayout><Dashboard /></MainLayout></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><MainLayout><Settings /></MainLayout></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute><MainLayout><Users /></MainLayout></ProtectedRoute>} />
      <Route path="/customers" element={<ProtectedRoute><MainLayout><Customers /></MainLayout></ProtectedRoute>} />
      <Route path="/labours" element={<ProtectedRoute><MainLayout><Labours /></MainLayout></ProtectedRoute>} />

      {/* Vendor */}
      <Route path="/vendor/dashboard" element={<ProtectedRoute><MainLayout><VendorDashboard /></MainLayout></ProtectedRoute>} />
      <Route path="/vendor/purchase-order" element={<ProtectedRoute><MainLayout><PurchaseOrder /></MainLayout></ProtectedRoute>} />
      <Route path="/vendor/purchase-order/create" element={<ProtectedRoute><MainLayout><CreatePurchaseOrder /></MainLayout></ProtectedRoute>} />
      <Route path="/vendor/purchase-order/edit/:id" element={<ProtectedRoute><MainLayout><EditPurchaseOrder /></MainLayout></ProtectedRoute>} />
      <Route path="/vendor/purchase-order/view/:id" element={<ProtectedRoute><MainLayout><ViewPurchaseOrder /></MainLayout></ProtectedRoute>} />
      <Route path="/vendor/purchase-order/approve" element={<ProtectedRoute><MainLayout><ApprovePurchaseOrder /></MainLayout></ProtectedRoute>} />
      <Route path="/vendor/purchase-order/quality-check/:id" element={<ProtectedRoute><MainLayout><PurchaseOrderQC /></MainLayout></ProtectedRoute>} />
      <Route path="/vendor/purchase-order/print/:id" element={<ProtectedRoute><MainLayout><PrintPurchaseOrder /></MainLayout></ProtectedRoute>} />

      <Route path="/vendor/invoice" element={<ProtectedRoute><MainLayout><VendorInvoice /></MainLayout></ProtectedRoute>} />
      <Route path="/vendor/invoice/view/:id" element={<ProtectedRoute><MainLayout><InvoiceDetail /></MainLayout></ProtectedRoute>} />
      <Route path="/vendor/payment" element={<ProtectedRoute><MainLayout><Payment /></MainLayout></ProtectedRoute>} />
      <Route path="/vendor/ledger/:id" element={<ProtectedRoute><MainLayout><Ledger /></MainLayout></ProtectedRoute>} />
      <Route path="/vendor/list" element={<ProtectedRoute><MainLayout><Vendor /></MainLayout></ProtectedRoute>} />
      <Route path="/vendor/create-vendor" element={<ProtectedRoute><MainLayout><CreateVendor /></MainLayout></ProtectedRoute>} />

      {/* Customer */}
      <Route path="/customer/dashboard" element={<ProtectedRoute><MainLayout><CustomerDashboard/></MainLayout></ProtectedRoute>}/>
      <Route path="/customer/quote" element={<ProtectedRoute><MainLayout><Quote/></MainLayout></ProtectedRoute>}/>
      <Route path="/customer/quote/view" element={<ProtectedRoute><MainLayout><QuoteDetailsView/></MainLayout></ProtectedRoute>}/>
      <Route path="/customer/quote/create" element={<ProtectedRoute><MainLayout><CreateQuote/></MainLayout></ProtectedRoute>}/>
      <Route path="/customer/quote/edit" element={<ProtectedRoute><MainLayout><EditQuote/></MainLayout></ProtectedRoute>}/>
      <Route path="/customer/order" element={<ProtectedRoute><MainLayout><Order/></MainLayout></ProtectedRoute>}/>
      <Route path="/customer/order/view" element={<ProtectedRoute><MainLayout><OrderDetailsView/></MainLayout></ProtectedRoute>}/>
      <Route path="/customer/order/create" element={<ProtectedRoute><MainLayout><CreateOrder/></MainLayout></ProtectedRoute>}/>
      <Route path="/customer/order/edit" element={<ProtectedRoute><MainLayout><EditOrder/></MainLayout></ProtectedRoute>}/>
      <Route path="/customer/ledger" element={<ProtectedRoute><MainLayout><CustomerLedger/></MainLayout></ProtectedRoute>}/>

      {/* Catch-all */}
       <Route path="*" element={<Error404 />} />
    </Routes>
  );
};

export default AppRoutes;
