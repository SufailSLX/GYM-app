import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Loader from "./components/Loader";
import LoginForm from "./components/LoginForm";
import OwnerDashboard from "./pages/OwnerDashboard";
import OwnerPlans from "./pages/OwnerPlans";
import UserPlans from "./pages/UserPlans";
import DetailsPage from "./pages/DetailsPage";
import { authAPI, paymentAPI } from "./services/api";

function App() {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [isLegacyOwner, setIsLegacyOwner] = useState(localStorage.getItem('isLegacyOwner') === 'true');

  // Handle back button/forward button
  useEffect(() => {
    const handlePopState = (event) => {
      // If user is a legacy owner and tries to go back, prevent it
      if (isLegacyOwner) {
        window.history.pushState(null, '', window.location.pathname);
      }
    };

    // Add event listener for popstate (back/forward navigation)
    window.addEventListener('popstate', handlePopState);
    
    // Add initial history entry to prevent going back to login
    if (isLegacyOwner) {
      window.history.pushState(null, '', window.location.pathname);
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isLegacyOwner]);

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
          
          // Check for legacy owner login
          const legacyOwner = userRole === 'owner' && user.email === "gym@mail.com";
          setIsLegacyOwner(legacyOwner);
          localStorage.setItem('isLegacyOwner', legacyOwner);

          // If user is not admin, check for active subscription
          if (userRole === 'user') {
            try {
              const subscriptionResponse = await paymentAPI.checkSubscription();
              if (subscriptionResponse.data && subscriptionResponse.data.isActive) {
                setHasActiveSubscription(true);
              }
            } catch (error) {
              console.error('Error checking subscription:', error);
              // If there's an error, assume no active subscription
              setHasActiveSubscription(false);
            }
          }
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

  return (
    <Router>
      <Routes>
        {!role && (
          <Route path="/login" element={<LoginForm setRole={setRole} />} />
        )}
        {!role && (
          <Route path="*" element={<Navigate to="/login" />} />
        )}
        {role === "owner" && isLegacyOwner && <Route path="/*" element={<OwnerPlans />} />}
        {/* {role === "owner" && !isLegacyOwner && <Route path="/*" element={<OwnerDashboard />} />} */}
        {role === "user" && hasActiveSubscription && (
          <Route path="/*" element={<DetailsPage />} />
        )}
        {role === "user" && !hasActiveSubscription && (
          <Route path="/*" element={<UserPlans />} />
        )}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;