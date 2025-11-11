import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { paymentAPI } from "../services/api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // Get plan details from location state or use defaults
  const plan = location.state?.plan || {
    id: "basic",
    title: "Basic Plan",
    price: 500,
    description: "Subscription Plan",
  };

  const handlePayment = async () => {
    if (!localStorage.getItem("token")) {
      toast.error("Please login to continue");
      navigate("/");
      return;
    }

    setLoading(true);
    try {
      // Create order on backend
      const orderResponse = await paymentAPI.createOrder({
        amount: plan.price,
        currency: "INR",
        isSubscription: true,
        planId: plan.id,
      });

      const { orderId, amount, currency } = orderResponse.data;

      // Get user data from localStorage
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      // Setup Razorpay checkout options
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_ReNEKukQGekglb",
        amount: amount,
        currency: currency,
        name: "GYM App",
        description: plan.description || "Subscription Payment",
        order_id: orderId,
        handler: async function (response) {
          try {
            // Verify payment on backend
            const verifyResponse = await paymentAPI.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              isSubscription: true,
              planId: plan.id,
            });

            if (verifyResponse.data.status === "success") {
              toast.success("✅ Payment successful! Your subscription is active.");
              setTimeout(() => {
                navigate("/");
              }, 2000);
            } else {
              toast.error("❌ Payment verification failed!");
            }
          } catch (error) {
            console.error("Payment verification error:", error);
            toast.error(error.response?.data?.error || "Payment verification failed");
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: user.name || "",
          email: user.email || "",
        },
        theme: {
          color: "#975af4",
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            toast.info("Payment cancelled");
          },
        },
      };

      // Open Razorpay modal
      const rzp = new window.Razorpay(options);

      // Handle payment failure
      rzp.on("payment.failed", function (response) {
        console.error("Payment failed:", response.error);
        toast.error(`❌ Payment failed: ${response.error.description || "Unknown error"}`);
        setLoading(false);
      });

      rzp.open();
    } catch (error) {
      console.error("Error during payment:", error);
      toast.error(error.response?.data?.error || "Failed to initiate payment");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 px-4">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="bg-gray-800 rounded-lg shadow-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          Checkout
        </h2>
        
        <div className="mb-6">
          <div className="bg-gray-700 rounded-lg p-4 mb-4">
            <h3 className="text-white font-semibold text-lg mb-2">{plan.title}</h3>
            <p className="text-gray-300 text-sm mb-2">{plan.description}</p>
            <p className="text-2xl font-bold text-white">₹{plan.price}</p>
          </div>
        </div>

        <button
          onClick={handlePayment}
          disabled={loading}
          className="w-full bg-gradient-to-br from-[#975af4] via-[#2f7cf8] to-[#934cff] text-white py-3 px-4 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Processing..." : `Pay ₹${plan.price}`}
        </button>

        <button
          onClick={() => navigate(-1)}
          className="w-full mt-4 bg-gray-700 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default Checkout;
