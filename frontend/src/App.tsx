import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import {
  ProtectedUserRoutes,
  ProtectedAdminRoutes,
} from "@/utils/ProtectedRoutes";
import { AuthProvider } from "@/lib/auth";
import CreateTicket from "@/pages/CreateTicket";
import Login from "@/pages/Login";
import SignUp from "@/pages/SignUp";
import { AdminDashBoard, UserDashBoard } from "@/pages/DashBoard";
import MyTickets from "@/pages/MyTickets";
import ManageTickets from "@/pages/admin/ManageTickets";
import ManageUsers from "@/pages/admin/ManageUsers";
import Unauthorized from "@/pages/Unauthorized";
import SeeTicket from "./pages/SeeTicket";

function App() {
  const [isDarkMode] = useState(true);

  useEffect(() => {
    document.body.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* User-protected routes */}
          <Route element={<ProtectedUserRoutes />}>
            <Route path="/" element={<UserDashBoard />} />
            <Route path="/tickets" element={<MyTickets />} />
            <Route path="/tickets/create" element={<CreateTicket />} />
            <Route path="/tickets/:ticket_id" element={<SeeTicket />} />
          </Route>

          {/* Admin-protected routes */}
          <Route element={<ProtectedAdminRoutes />}>
            <Route path="/admin" element={<AdminDashBoard />} />
            <Route path="/admin/tickets" element={<ManageTickets />} />
            <Route path="/admin/users" element={<ManageUsers />} />
            <Route path="/admin/reports" />
          </Route>

          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
