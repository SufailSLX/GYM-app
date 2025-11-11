import React, { useState, useEffect } from "react";
import { paymentAPI } from "../services/api";

const DEMO_OWNER = {
  username: "GYM Owner",
  email: "gym@mail.com",
  subscriptionPlan: "Premium Plan",
  subscriptionExpiry: "2025-12-31",
};

const OwnerDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [owner] = useState(DEMO_OWNER);
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const response = await paymentAPI.getRecentPayments();
        setPayments(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching payments:', err);
        setError('Failed to load payment data');
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  useEffect(() => {
    // Demo: fake loading
    setTimeout(() => setLoading(false), 900);
  }, []);

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100 text-xl font-semibold">
        Loading dashboard...
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-r from-gray-100 to-gray-200 p-6">
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Welcome, {owner.username}
        </h1>
        <button
          onClick={() => {
            // Clear all authentication related data
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('role');
            // Redirect to login page
            window.location.href = '/';
          }}
          className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
        >
          Logout
        </button>
      </header>

      {/* Owner Details */}
      <section className="bg-white rounded-xl shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-3">Subscription Status</h2>
        <div className="flex justify-between items-center">
          <p>
            <span className="font-semibold">Plan:</span> {owner.subscriptionPlan}
          </p>
          <p>
            <span className="font-semibold">Valid till:</span> {owner.subscriptionExpiry}
          </p>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md">
            Renew / Upgrade
          </button>
        </div>
      </section>

      {/* Recent Payments */}
      <section className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Payments</h2>
        {error ? (
          <div className="text-red-500 mb-4">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-3 px-4 border-b text-left">Member</th>
                  <th className="py-3 px-4 border-b text-right">Amount (₹)</th>
                  <th className="py-3 px-4 border-b text-left">Plan</th>
                  <th className="py-3 px-4 border-b text-left">Date</th>
                  <th className="py-3 px-4 border-b text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.length > 0 ? (
                  payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 border-b">{payment.member}</td>
                      <td className="py-3 px-4 border-b text-right">
                        ₹{payment.amount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 border-b">{payment.plan}</td>
                      <td className="py-3 px-4 border-b">
                        {new Date(payment.date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 border-b text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          payment.status === 'paid' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-4 text-center text-gray-500">
                      {loading ? 'Loading payments...' : 'No payment records found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default OwnerDashboard;
