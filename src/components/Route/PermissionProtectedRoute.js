import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
const PermissionProtectedRoute = ({ 
  children, 
  requiredPermissions = [],
  requireAll = true // true = AND logic, false = OR logic
}) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }


  if (requiredPermissions.length === 0) {
    return children;
  }

  // Super admin bypass
//   if (user?.role === 'super_admin' || user?.isSuperAdmin === true) {
//     return children;
//   }

  
  const userPermissions = user?.permissions || [];
  const hasPermission = requireAll
    ? requiredPermissions.every(permission => userPermissions.includes(permission))
    : requiredPermissions.some(permission => userPermissions.includes(permission));

  // If user doesn't have permission, show 403
  if (!hasPermission) {
    return <Navigate to="/403" replace />;
  }

  return children;
};

export default PermissionProtectedRoute;