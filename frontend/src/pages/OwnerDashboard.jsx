import React, { useState, useEffect } from "react";
import { paymentAPI } from "../services/api";
import { X } from 'lucide-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const OwnerDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [owner, setOwner] = useState({
    username: "GYM Owner",
    email: "gym@mail.com",
    subscriptionPlan: "Premium Plan",
    subscriptionExpiry: null,
  });
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch subscription status
        const subscriptionResponse = await paymentAPI.checkSubscription();
        const subscription = subscriptionResponse.data;
        
        if (subscription && subscription.isActive) {
          // Format the validTill date
          const validTillDate = new Date(subscription.validTill);
          const formattedDate = validTillDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
          
          setSubscriptionData(subscription);
          setOwner(prev => ({
            ...prev,
            subscriptionExpiry: formattedDate,
            subscriptionValidTill: subscription.validTill,
            planId: subscription.planId || 'basic'
          }));
        } else {
          // Fallback to localStorage if API doesn't have it
          const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
          if (storedUser.subscriptionValidTill) {
            const validTillDate = new Date(storedUser.subscriptionValidTill);
            const formattedDate = validTillDate.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
            
            setOwner(prev => ({
              ...prev,
              subscriptionExpiry: formattedDate,
              subscriptionValidTill: storedUser.subscriptionValidTill
            }));
          }
        }

        // Fetch recent payments
        const paymentsResponse = await paymentAPI.getRecentPayments();
        setPayments(paymentsResponse.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data');
        
        // Fallback to localStorage
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (storedUser.subscriptionValidTill) {
          const validTillDate = new Date(storedUser.subscriptionValidTill);
          const formattedDate = validTillDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
          
          setOwner(prev => ({
            ...prev,
            subscriptionExpiry: formattedDate,
            subscriptionValidTill: storedUser.subscriptionValidTill
          }));
        }
        
        setLoading(false);
      }
    };

    fetchData();
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
            <span className="font-semibold">Valid till:</span> {owner.subscriptionExpiry || 'Loading...'}
          </p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            Info
          </button>
        </div>
      </section>

      {/* Info Modal */}
      {isModalOpen && (
        <div className="w-full mb-6 bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Subscription Details</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Current Plan:</span>
                <span className="font-medium">{owner.subscriptionPlan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Expiry Date:</span>
                <span className="font-medium">{owner.subscriptionExpiry || 'N/A'}</span>
              </div>
              {subscriptionData && subscriptionData.daysRemaining !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Days Remaining:</span>
                  <span className="font-medium">{subscriptionData.daysRemaining} days</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="text-green-600 font-medium">Active</span>
              </div>
              <div className="pt-4 mt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Your subscription is valid for 30 days from the payment date. For any queries regarding your subscription, please contact our support team.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={async () => {
                  if (window.confirm('Are you sure you want to deactivate your subscription? You will be logged out and need to subscribe again to access the dashboard.')) {
                    try {
                      setIsDeactivating(true);
                      await paymentAPI.deactivateSubscription();
                      
                      // Clear subscription status from local storage
                      const user = JSON.parse(localStorage.getItem('user') || '{}');
                      localStorage.setItem('user', JSON.stringify({
                        ...user,
                        isSubscribed: false,
                        subscriptionValidTill: null
                      }));
                      
                      // Set isLegacyOwner to true so they'll be redirected to plans page on next login
                      localStorage.setItem('isLegacyOwner', 'true');
                      
                      toast.success('Subscription deactivated successfully');
                      
                      // Clear all authentication related data
                      localStorage.removeItem('token');
                      localStorage.removeItem('user');
                      localStorage.removeItem('role');
                      
                      // Redirect to login page
                      window.location.href = '/login';
                    } catch (error) {
                      console.error('Error deactivating subscription:', error);
                      toast.error(error.response?.data?.error || 'Failed to deactivate subscription');
                      setIsDeactivating(false);
                    }
                  }
                }}
                disabled={isDeactivating}
                className={`px-4 py-2 ${isDeactivating ? 'bg-gray-400' : 'bg-red-600 hover:bg-red-700'} text-white rounded-md transition-colors`}
              >
                {isDeactivating ? 'Deactivating...' : 'Deactivate'}
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={isDeactivating}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
                      <td className="py-3 px-4 border-b">
                        {payment.member || payment.user || 'Guest'}
                      </td>
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
