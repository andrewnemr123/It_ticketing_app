import { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import { ProtectedUserRoutes, ProtectedAdminRoutes } from "@/utils/ProtectedRoutes";
import CreateTicket from "@/pages/CreateTicket";
import Login from "@/pages/Login";
import SignUp from "@/pages/SignUp";
import { AdminDashBoard, UserDashBoard } from "@/pages/DashBoard";

function App() {
  const [isDarkMode, _] = useState(true);

  useEffect(() => {
    document.body.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  return (
    <BrowserRouter>
      <Routes>
        {/* User-protected routes */}
        <Route element={<ProtectedUserRoutes />}>
          <Route path="/" element={<UserDashBoard />} />
          <Route path="/tickets" />
          <Route path="/tickets/create" element={<CreateTicket />} />
        </Route>

        {/* Admin-protected routes */}
        <Route element={<ProtectedAdminRoutes />}>
          <Route path="/admin" element={<AdminDashBoard />} />
          <Route path="/admin/tickets" />
          <Route path="/admin/users" />
          <Route path="/admin/reports" />
        </Route>

        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/unauthorized" />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
