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
  const [ownerHasActiveSubscription, setOwnerHasActiveSubscription] = useState(false);
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
          
          // Preserve subscription data from localStorage if it exists (important after payment)
          const existingUser = JSON.parse(localStorage.getItem('user') || '{}');
          const hasLocalSubscription = existingUser.isSubscribed && existingUser.subscriptionValidTill;
          
          // Merge user data, preserving subscription info if it exists in localStorage
          const mergedUser = {
            ...user,
            ...(hasLocalSubscription && {
              isSubscribed: existingUser.isSubscribed,
              subscriptionValidTill: existingUser.subscriptionValidTill
            })
          };
          
          // Determine role (fallback to stored role if backend doesn't provide it)
          const userRole = storedRole || (user.email === "gym@mail.com" ? "owner" : "user");
          setRole(userRole);
          localStorage.setItem("user", JSON.stringify(mergedUser));
          
          console.log('User data merged:', {
            fromBackend: user,
            fromLocalStorage: existingUser,
            merged: mergedUser,
            preservedSubscription: hasLocalSubscription
          });
          
          // Check for legacy owner login
          const legacyOwner = userRole === 'owner' && user.email === "gym@mail.com";
          setIsLegacyOwner(legacyOwner);
          localStorage.setItem('isLegacyOwner', legacyOwner);

          // Check for active subscription for both users and owners
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
          } else if (userRole === 'owner') {
            // Check localStorage first (this is updated immediately after payment)
            const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
            let localStorageHasSubscription = false;
            
            if (storedUser.isSubscribed && storedUser.subscriptionValidTill) {
              // Parse the date string from localStorage
              const validTillDate = new Date(storedUser.subscriptionValidTill);
              const now = new Date();
              localStorageHasSubscription = validTillDate > now;
              console.log('LocalStorage subscription check:', {
                isSubscribed: storedUser.isSubscribed,
                subscriptionValidTill: storedUser.subscriptionValidTill,
                validTillDate: validTillDate,
                now: now,
                isActive: localStorageHasSubscription,
                timeDiff: validTillDate.getTime() - now.getTime()
              });
            } else {
              console.log('LocalStorage subscription check: No subscription data in localStorage', storedUser);
            }
            
            // PRIORITIZE localStorage - if it says subscription is active, allow access immediately
            // This is critical right after payment when backend might not have synced yet
            if (localStorageHasSubscription) {
              console.log('✅ Allowing access based on localStorage subscription');
              setOwnerHasActiveSubscription(true);
              setIsLegacyOwner(false);
              localStorage.setItem('isLegacyOwner', 'false');
              
              // Still check API in background to sync, but don't block access
              paymentAPI.checkSubscription()
                .then(subscriptionResponse => {
                  const apiHasSubscription = subscriptionResponse.data && subscriptionResponse.data.isActive;
                  console.log('API subscription check (background):', {
                    isActive: apiHasSubscription,
                    data: subscriptionResponse.data
                  });
                  
                  // If API confirms subscription, update localStorage with backend data
                  if (apiHasSubscription && subscriptionResponse.data.validTill) {
                    const user = JSON.parse(localStorage.getItem('user') || '{}');
                    localStorage.setItem('user', JSON.stringify({
                      ...user,
                      isSubscribed: true,
                      subscriptionValidTill: new Date(subscriptionResponse.data.validTill).toISOString()
                    }));
                  }
                })
                .catch(error => {
                  console.error('Error checking owner subscription (background):', error);
                });
            } else {
              // If localStorage doesn't have subscription, check API
              try {
                const subscriptionResponse = await paymentAPI.checkSubscription();
                const apiHasSubscription = subscriptionResponse.data && subscriptionResponse.data.isActive;
                
                console.log('API subscription check:', {
                  isActive: apiHasSubscription,
                  data: subscriptionResponse.data
                });
                
                if (apiHasSubscription) {
                  setOwnerHasActiveSubscription(true);
                  setIsLegacyOwner(false);
                  localStorage.setItem('isLegacyOwner', 'false');
                  
                  // Update localStorage with API data
                  if (subscriptionResponse.data.validTill) {
                    const user = JSON.parse(localStorage.getItem('user') || '{}');
                    localStorage.setItem('user', JSON.stringify({
                      ...user,
                      isSubscribed: true,
                      subscriptionValidTill: new Date(subscriptionResponse.data.validTill).toISOString()
                    }));
                  }
                } else {
                  setOwnerHasActiveSubscription(false);
                  setIsLegacyOwner(true);
                  localStorage.setItem('isLegacyOwner', 'true');
                }
              } catch (error) {
                console.error('Error checking owner subscription:', error);
                setOwnerHasActiveSubscription(false);
                setIsLegacyOwner(true);
                localStorage.setItem('isLegacyOwner', 'true');
              }
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
        {/* Public routes */}
        <Route path="/login" element={!role ? <LoginForm setRole={setRole} /> : <Navigate to="/" />} />
        
        {/* Protected routes for owners */}
        {role === "owner" && (
          <>
            <Route path="/owner/dashboard" element={
              ownerHasActiveSubscription ? <OwnerDashboard /> : <Navigate to="/owner/plans" replace />
            } />
            <Route path="/owner/plans" element={
              !ownerHasActiveSubscription ? <OwnerPlans /> : <Navigate to="/owner/dashboard" replace />
            } />
          </>
        )}
        
        {role === "user" && hasActiveSubscription && (
          <Route path="/dashboard" element={<DetailsPage />} />
        )}
        
        {role === "user" && !hasActiveSubscription && (
          <Route path="/plans" element={<UserPlans />} />
        )}
        
        {/* Redirects */}
        <Route path="/" element={
          !role ? <Navigate to="/login" /> : 
          role === 'owner' ? (
            ownerHasActiveSubscription ? <Navigate to="/owner/dashboard" /> : <Navigate to="/owner/plans" />
          ) : (
            hasActiveSubscription ? <Navigate to="/dashboard" /> : <Navigate to="/plans" />
          )
        } />
        
        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;