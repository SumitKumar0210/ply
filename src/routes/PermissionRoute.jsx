// ./routes/PermissionRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * PermissionRoute
 * Props:
 *  - children: ReactNode
 *  - permission: string (single permission, checked via hasPermission)
 *  - anyPermissions: string[] (OR-check, checked via hasAnyPermission)
 *
 * Behavior:
 *  - While background checking is in progress -> render children (avoid flicker)
 *  - If not authenticated -> redirect to /login
 *  - If permission(s) required and not satisfied -> redirect to /403
 */
const PermissionRoute = ({ children, permission = null, anyPermissions = null }) => {
  const { checking, isAuthenticated, hasPermission, hasAnyPermission } = useAuth();

  // Avoid redirect while auth is being validated in background
  if (checking) return children;

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (permission && !hasPermission(permission)) return <Navigate to="/403" replace />;

  if (Array.isArray(anyPermissions) && anyPermissions.length > 0) {
    if (!hasAnyPermission(anyPermissions)) return <Navigate to="/403" replace />;
  }

  return children;
};

export default PermissionRoute;
