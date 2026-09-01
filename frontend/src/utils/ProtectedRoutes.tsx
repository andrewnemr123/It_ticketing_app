import { Outlet, Navigate } from "react-router-dom";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/lib/auth";

function LoadingScreen() {
  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <Spinner className="size-6" />
    </div>
  );
}

export function ProtectedUserRoutes() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
}

export function ProtectedAdminRoutes() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "ADMIN") return <Navigate to="/unauthorized" replace />;

  return <Outlet />;
}
