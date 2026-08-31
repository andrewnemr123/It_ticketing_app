import { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import DashBoard from "./pages/DashBoard";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import ProtectedRoutes from "./utils/ProtectedRoutes";
import CreateTicket from "./pages/CreateTicket";

function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    document.body.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/create-ticket" element={<CreateTicket />} />

        <Route element={<ProtectedRoutes />}>
          <Route path="/dashboard" element={<DashBoard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
