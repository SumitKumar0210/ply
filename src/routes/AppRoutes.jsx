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
import OrderDetailsView from "../pages/Customer/Order/OrderDetailsView";
import CreateOrder from "../pages/Customer/Order/CreateOrder";
import EditOrder from "../pages/Customer/Order/EditOrder";
import CustomerLedger from "../pages/Customer/Ledger/Ledger";
import Vendor from "../pages/Vendor/Ledger/vendor";
import PublicQuoteDetailsView from "../pages/Public/Quotation";
import Order from "../pages/Customer/Order/Order";
import OwnProductionOrder from "../pages/Production/order";
import AddOrder from "../pages/Production/addOrder";
import Customer from "../pages/Customer/Ledger/Customer";
import Production from "../pages/Production/Production";
import ProductRequest from "../pages/Production/ProductRequest";
import ReadyProduct from "../pages/Production/ReadyProduct";
import ProductChallan from "../pages/Production/ProductChallna";
import Bills from "../pages/Billing/Bills";
import GenerateBill from "../pages/Billing/GenerateBill";
import EditBill from "../pages/Billing/EditGenerateBill";
import ViewBill from "../pages/Billing/ViewBill";
import Challan from "../pages/Billing/Challan";

import Error404 from "../pages/error/404";

const AppRoutes = () => {
  return (
    <Routes>
      {/* Default → Login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* public link */}
      <Route path="/quotation/:link" element={<PublicQuoteDetailsView />} />

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
      <Route path="/customer/dashboard" element={<ProtectedRoute><MainLayout><CustomerDashboard /></MainLayout></ProtectedRoute>} />
      <Route path="/customer/quote" element={<ProtectedRoute><MainLayout><Quote /></MainLayout></ProtectedRoute>} />
      <Route path="/customer/quote/view/:id" element={<ProtectedRoute><MainLayout><QuoteDetailsView /></MainLayout></ProtectedRoute>} />
      <Route path="/customer/quote/create" element={<ProtectedRoute><MainLayout><CreateQuote /></MainLayout></ProtectedRoute>} />
      <Route path="/customer/quote/edit/:id" element={<ProtectedRoute><MainLayout><EditQuote /></MainLayout></ProtectedRoute>} />
      <Route path="/customer/order" element={<ProtectedRoute><MainLayout><Order /></MainLayout></ProtectedRoute>} />
      <Route path="/customer/order/view/:id" element={<ProtectedRoute><MainLayout><OrderDetailsView /></MainLayout></ProtectedRoute>} />
      <Route path="/customer/order/create" element={<ProtectedRoute><MainLayout><CreateOrder /></MainLayout></ProtectedRoute>} />
      <Route path="/customer/order/edit/:id" element={<ProtectedRoute><MainLayout><EditOrder /></MainLayout></ProtectedRoute>} />
      <Route path="/customer/list" element={<ProtectedRoute><MainLayout><Customer /></MainLayout></ProtectedRoute>} />
      <Route path="/customer/ledger/:id" element={<ProtectedRoute><MainLayout><CustomerLedger /></MainLayout></ProtectedRoute>} />


      {/* Production */}
      <Route path="/production/create-order" element={<ProtectedRoute><MainLayout><AddOrder /></MainLayout></ProtectedRoute>} />
      <Route path="/production/orders" element={<ProtectedRoute><MainLayout><OwnProductionOrder /></MainLayout></ProtectedRoute>} />
      <Route path="/production/production-chain" element={<ProtectedRoute><MainLayout><Production /></MainLayout></ProtectedRoute>} />
      <Route path="/production/product-request" element={<ProtectedRoute><MainLayout><ProductRequest /></MainLayout></ProtectedRoute>} />
      <Route path="/product/ready-product" element={<ProtectedRoute><MainLayout><ReadyProduct /></MainLayout></ProtectedRoute>} />
      <Route path="/product/challan/:id" element={<ProtectedRoute><MainLayout><ProductChallan /></MainLayout></ProtectedRoute>} />

      {/* Bills */}
      <Route path="/bills" element={<ProtectedRoute><MainLayout><Bills /></MainLayout></ProtectedRoute>} />
      <Route path="/bill/generate-bill" element={<ProtectedRoute><MainLayout><GenerateBill /></MainLayout></ProtectedRoute>} />
      <Route path="/bill/edit-bill/:id" element={<ProtectedRoute><MainLayout><EditBill /></MainLayout></ProtectedRoute>} />
      <Route path="/bill/view/:id" element={<ProtectedRoute><MainLayout><ViewBill /></MainLayout></ProtectedRoute>} />
      <Route path="/bill/challan/:id" element={<ProtectedRoute><MainLayout><Challan /></MainLayout></ProtectedRoute>} />



      {/* Catch-all */}
      <Route path="*" element={<Error404 />} />
    </Routes>
  );
};

export default AppRoutes;
