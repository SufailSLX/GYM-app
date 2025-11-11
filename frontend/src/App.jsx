import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Loader from "./components/Loader";
import LoginForm from "./components/LoginForm";
import OwnerDashboard from "./pages/OwnerDashboard";
import UserPlans from "./pages/UserPlans";
import { authAPI } from "./services/api";

function App() {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);

  useEffect(() => {
    // Check authentication on app load
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      const storedRole = localStorage.getItem("role");

      if (token) {
        try {
          // Verify token with backend
          const response = await authAPI.getMe();
          const user = response.data.user;
          
          // Determine role (fallback to stored role if backend doesn't provide it)
          const userRole = storedRole || (user.email === "gym@mail.com" ? "owner" : "user");
          setRole(userRole);
          localStorage.setItem("user", JSON.stringify(user));
        } catch (error) {
          // Token invalid, clear storage
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          localStorage.removeItem("role");
        }
      } else if (storedRole) {
        // Fallback to stored role if no token (for backward compatibility)
        setRole(storedRole);
      }
      
      setLoading(false);
    };

    checkAuth();
  }, []);

  if (loading) return <Loader />;

  if (!role) return <LoginForm setRole={setRole} />;

  return (
    <Router>
      <Routes>
        {role === "owner" && <Route path="/*" element={<OwnerDashboard />} />}
        {role === "user" && <Route path="/*" element={<UserPlans />} />}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
