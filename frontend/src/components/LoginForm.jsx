import React, { useState } from "react";
import "./LoginForm.css";
import { authAPI } from "../services/api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const predefinedAccounts = [
  { email: "gym@mail.com", password: "admin123", role: "owner" },
  { email: "owner@mail.com", password: "admin123", role: "owner" },
  { email: "user@mail.com", password: "user123", role: "user" },
];

const LoginForm = ({ setRole }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [showSignup, setShowSignup] = useState(false);
  const [showLegacy, setShowLegacy] = useState(false);
  const [legacyError, setLegacyError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Basic validation
    if (!email || !password) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    try {
      // Try backend authentication
      const response = await authAPI.login({ email, password });
      
      if (response.data && response.data.token) {
        const { token, user } = response.data;
        
        // Store token and user data
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        
        // Set role from the user object
        localStorage.setItem("role", user.role);
        setRole(user.role);
        
        toast.success("Login successful!");
        // Redirect or perform any post-login action
        window.location.href = "/dashboard";
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      console.error("Login error:", err);
      const errorMessage = err.response?.data?.error || 
                         err.message || 
                         "Failed to login. Please check your credentials and try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Basic validation
    if (!username || !email || !password) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    try {
      const response = await authAPI.register({
        name: username,
        email,
        password,
      });

      if (response.data && response.data.token) {
        const { token, user } = response.data;

        // Store token and user data with role from the response
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("role", user.role);
        setRole(user.role);
        setRole("user");

        toast.success(`✅ Account created for ${username}!`);
        // Redirect to dashboard or home page
        window.location.href = "/dashboard";
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      console.error("Signup error:", err);
      const errorMessage = err.response?.data?.error || 
                         err.message || 
                         "Failed to create account. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLegacySubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setLegacyError("");

    try {
      // Try backend authentication
      const response = await authAPI.login({ email, password });
      const { token, user } = response.data;

      // Store token and user data
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("role", "owner");
      setRole("owner");
      setShowLegacy(false);
      
      // Check if owner has an active subscription
      try {
        const subscriptionResponse = await paymentAPI.checkSubscription();
        if (subscriptionResponse.data && subscriptionResponse.data.isActive) {
          // Redirect to dashboard if subscription is active
          window.location.href = "/owner/dashboard";
        } else {
          // Redirect to plans page if no active subscription
          window.location.href = "/owner/plans";
        }
      } catch (error) {
        console.error('Error checking subscription status:', error);
        // Default to dashboard if there's an error checking subscription
        window.location.href = "/owner/dashboard";
      }
      
      toast.success("Login successful!");
    } catch (err) {
      // Fallback to hardcoded check
      if (email === "gym@mail.com" && password === "admin123") {
        localStorage.setItem("role", "owner");
        setRole("owner");
        setShowLegacy(false);
        
        // For demo purposes, redirect to dashboard with hardcoded credentials
        // In a real app, you would check subscription status as above
        window.location.href = "/owner/dashboard";
        toast.success("Login successful!");
      } else {
        setLegacyError("Invalid legacy owner credentials");
        toast.error("Invalid credentials");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <ToastContainer position="top-right" autoClose={3000} />
      <form className="form shadow-lg" onSubmit={handleSubmit}>
        <h2 className="text-xl font-semibold text-center mb-4">GYM Login</h2>
        <div className="flex-column">
          <label>Email</label>
        </div>
        <div className="inputForm">
          <input
            placeholder="Enter your Email"
            className="input"
            type="text"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="flex-column">
          <label>Password</label>
        </div>
        <div className="inputForm">
          <input
            placeholder="Enter your Password"
            className="input"
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button className="button-submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
        <p className="p">
          Don’t have an account?
          <span className="span" onClick={() => setShowSignup(true)}>
            {" "}Sign Up
          </span>
        </p>
        <p className="p line">
          <span className="span" onClick={() => {
            setShowLegacy(true);
            setLegacyError("");
          }}>
            Legacy Login for Owner
          </span>
        </p>
      </form>
      {/* 🧩 Signup Modal */}
      {showSignup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <form
            onSubmit={handleSignupSubmit}
            className="bg-white rounded-xl shadow-lg p-8 w-[400px] relative"
          >
            <button
              type="button"
              onClick={() => setShowSignup(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl"
            >
              ×
            </button>
            <h3 className="text-xl font-semibold mb-4 text-center">Sign Up</h3>
            <div className="flex-column">
              <label>Username</label>
              <div className="inputForm mt-1">
                <input
                  placeholder="Enter your Username"
                  className="input"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="flex-column mt-3">
              <label>Email</label>
              <div className="inputForm mt-1">
                <input
                  placeholder="Enter your Email"
                  className="input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="flex-column mt-3">
              <label>Password</label>
              <div className="inputForm mt-1">
                <input
                  placeholder="Enter your Password"
                  className="input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <button className="button-submit mt-5 w-full">Create Account</button>
          </form>
        </div>
      )}
      {/* 👑 Legacy Owner Login Modal */}
      {showLegacy && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <form
            onSubmit={handleLegacySubmit}
            className="bg-white rounded-xl shadow-lg p-8 w-[400px] relative"
          >
            <button
              type="button"
              onClick={() => setShowLegacy(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl"
            >
              ×
            </button>
            <h3 className="text-xl font-semibold mb-4 text-center">
              Legacy Owner Login
            </h3>
            <div className="flex-column">
              <label>Email</label>
              <div className="inputForm mt-1">
                <input
                  placeholder="Enter your Email"
                  className="input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="flex-column mt-3">
              <label>Password</label>
              <div className="inputForm mt-1">
                <input
                  placeholder="Enter your Password"
                  className="input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            {legacyError && <p className="text-red-500 text-sm text-center mt-2">{legacyError}</p>}
            <button className="button-submit mt-5 w-full">Login as Owner</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default LoginForm;
