import { Outlet, Navigate } from "react-router-dom";

export function ProtectedUserRoutes() {
  const user = true;

  return user ? <Outlet /> : <Navigate to="/login" replace />;
}

export function ProtectedAdminRoutes() {
  const user = true;
  const isAdmin = true;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
