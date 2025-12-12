// ./routes/SecurePage.jsx
import React, { useMemo } from "react";
import ProtectedRoute from "./ProtectedRoute";
import PermissionRoute from "./PermissionRoute";
import MainLayout from "../layouts/MainLayout";

/**
 * SecurePage: composition wrapper to use in routes
 * Props:
 *  - children: ReactNode (page component)
 *  - permission: string (single permission)
 *  - anyPermissions: string[] (OR-style permission check)
 *
 * Usage:
 *  <SecurePage permission="foo.bar"><Page /></SecurePage>
 *  <SecurePage anyPermissions={["a","b"]}><Page /></SecurePage>
 */
const SecurePage = ({ children, permission = null, anyPermissions = null }) => {
  const Wrapped = useMemo(
    () => (
      <ProtectedRoute>
        <PermissionRoute permission={permission} anyPermissions={anyPermissions}>
          <MainLayout>{children}</MainLayout>
        </PermissionRoute>
      </ProtectedRoute>
    ),
    // keep dependencies minimal so wrapper is stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [permission, anyPermissions]
  );

  return Wrapped;
};

export default SecurePage;
