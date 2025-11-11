import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

const DEMO_USER = {
  username: "GYM Member",
  email: "user@mail.com",
  role: "member",
};
const chartData = [
  { name: "Mon", income: 200 },
  { name: "Tue", income: 400 },
  { name: "Wed", income: 800 },
  { name: "Thu", income: 700 },
  { name: "Fri", income: 950 },
  { name: "Sat", income: 1100 },
  { name: "Sun", income: 600 },
];

const DetailsPage = () => {
  const [user, setUser] = useState(DEMO_USER);
  const [loading, setLoading] = useState(true);
  const [activeCard, setActiveCard] = useState(0);
  const cards = ["Profile", "Membership", "Workout Stats", "Payments"];

  useEffect(() => {
    setTimeout(() => setLoading(false), 900);
  }, []);

  const logoutHandler = () => {
    localStorage.removeItem("role");
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0b0f19] via-[#0c1428] to-[#010204]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0b0f19] via-[#0c1428] to-[#010204] text-white flex flex-col items-center p-6">
      {/* Header */}
      <div className="flex justify-between items-center w-full max-w-5xl mb-6">
        <h1 className="text-3xl font-semibold">🏋️‍♂️ Gym Dashboard</h1>
        <button
          onClick={logoutHandler}
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-semibold"
        >
          Logout
        </button>
      </div>

      {/* Swipe Buttons */}
      <div className="flex gap-3 mb-8">
        {cards.map((c, i) => (
          <button
            key={i}
            onClick={() => setActiveCard(i)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
              i === activeCard
                ? "bg-blue-600 text-white"
                : "bg-gray-800 hover:bg-gray-700 text-gray-300"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Card Container */}
      <motion.div
        key={activeCard}
        initial={{ opacity: 0, y: 25 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-5xl bg-gradient-to-br from-[#111827]/60 to-[#1f2937]/60 backdrop-blur-xl border border-gray-700/40 rounded-2xl p-8 shadow-2xl"
      >
        {/* PROFILE CARD */}
        {activeCard === 0 && (
          <div>
            <h2 className="text-gray-400 text-sm mb-2">USER PROFILE</h2>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-2xl font-semibold">{user?.username || 'User'}</h3>
                <p className="text-gray-400">{user?.email || 'No email provided'}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Role: <span className="text-blue-400">{user?.role}</span>
                </p>
              </div>
              <span className="bg-green-600/20 text-green-400 px-3 py-1 rounded-full text-xs font-semibold">
                Active
              </span>
            </div>
            <div className="grid grid-cols-2 gap-6 text-gray-300">
              <p>Total Workouts: <span className="text-white font-semibold">35</span></p>
              <p>Calories Burned: <span className="text-white font-semibold">12,540</span></p>
              <p>Trainer: <span className="text-white font-semibold">John Smith</span></p>
              <p>Joined: <span className="text-white font-semibold">Sep 2025</span></p>
            </div>
          </div>
        )}

        {/* MEMBERSHIP CARD */}
        {activeCard === 1 && (
          <div>
            <h2 className="text-gray-400 text-sm mb-2">ACTIVE MEMBERSHIP</h2>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-semibold">Premium Plan</h3>
                <p className="text-gray-400">Access to all gym facilities</p>
              </div>
              <span className="bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full text-xs font-semibold">
                SUBSCRIBED
              </span>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Expires: <span className="text-white">Dec 10, 2025</span>
            </p>
            <button className="bg-red-600 hover:bg-red-700 px-5 py-2 rounded-lg text-sm font-medium">
              Cancel Subscription
            </button>
          </div>
        )}

        {/* WORKOUT STATS CARD */}
        {activeCard === 2 && (
          <div>
            <h2 className="text-gray-400 text-sm mb-2">WORKOUT STATISTICS</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-4 text-center">
              <div className="bg-gray-800/60 rounded-xl p-4">
                <h3 className="text-2xl font-bold text-blue-400">5</h3>
                <p className="text-gray-400 text-sm">Sessions this week</p>
              </div>
              <div className="bg-gray-800/60 rounded-xl p-4">
                <h3 className="text-2xl font-bold text-green-400">12,540</h3>
                <p className="text-gray-400 text-sm">Calories burned</p>
              </div>
              <div className="bg-gray-800/60 rounded-xl p-4">
                <h3 className="text-2xl font-bold text-yellow-400">28</h3>
                <p className="text-gray-400 text-sm">Days Active</p>
              </div>
              <div className="bg-gray-800/60 rounded-xl p-4">
                <h3 className="text-2xl font-bold text-purple-400">4.8⭐</h3>
                <p className="text-gray-400 text-sm">Trainer Rating</p>
              </div>
            </div>
          </div>
        )}

        {/* PAYMENT OVERVIEW CARD */}
        {activeCard === 3 && (
          <div>
            <h2 className="text-gray-400 text-sm mb-4">PAYMENT OVERVIEW</h2>
            <div className="flex justify-between mb-6">
              <div>
                <p className="text-gray-400 text-sm">Total Paid</p>
                <h3 className="text-3xl font-semibold text-white">₹960</h3>
              </div>
              <div className="text-right">
                <p className="text-gray-400 text-sm">Projected Spend</p>
                <h3 className="text-2xl font-semibold text-gray-300">₹1,290</h3>
              </div>
            </div>
            {/* Demo: chart area placeholder */}
            <div className="w-full h-48 text-center flex items-center justify-center bg-gray-900/30 rounded-xl border border-gray-700 text-gray-400">
              [Your payment chart here]
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default DetailsPage;