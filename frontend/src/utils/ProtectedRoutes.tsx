import { Outlet, Navigate } from "react-router-dom";

function ProtectedRoutes() {
  // TODO: route depending on authentication
  const user = true;
  return user ? <Outlet /> : <Navigate to="/login" />;
}

export default ProtectedRoutes;
