import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { plansAPI, paymentAPI } from "../services/api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const defaultPlans = [
  {
    id: "basic",
    title: "Basic",
    price: 499,
    popular: false,
    description: "Best for beginners and testing the platform",
    features: ["Basic Dashboard", "Limited Reports", "Community Support"],
    buttonText: "Get Started",
  },
  {
    id: "pro",
    title: "Professional",
    price: 899,
    popular: true,
    description: "Best for growing startups and growth companies",
    features: [
      "Customizable Dashboards",
      "Advanced Budgeting",
      "Enhanced Security",
    ],
    buttonText: "Upgrade Now",
  },
  {
    id: "premium",
    title: "Premium",
    price: 1999,
    popular: false,
    description: "For teams that need scalability and performance",
    features: [
      "Unlimited Members",
      "AI Insights",
      "Priority Support",
      "Exclusive Templates",
    ],
    buttonText: "Upgrade Now",
  },
];

const UserPlans = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState(defaultPlans);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch plans from backend
    const fetchPlans = async () => {
      try {
        const response = await plansAPI.getPlans();
        if (response.data && response.data.length > 0) {
          // Map backend plans to frontend format
          const mappedPlans = response.data.map((plan, index) => ({
            id: plan.id,
            title: plan.name,
            price: plan.price,
            popular: index === 1, // Make middle plan popular
            description: `Valid for ${plan.duration} days`,
            features: [
              "Customizable Dashboards",
              "Advanced Features",
              "Priority Support",
            ],
            buttonText: "Subscribe Now",
            duration: plan.duration,
          }));
          setPlans(mappedPlans);
        }
      } catch (error) {
        console.error("Error fetching plans:", error);
        // Use default plans if API fails
      }
    };
    fetchPlans();
  }, []);

  const handlePayment = async (plan) => {
    if (!localStorage.getItem("token")) {
      toast.error("Please login to continue");
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

      // Setup Razorpay options
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_ReNEKukQGekglb",
        amount: amount,
        currency: currency,
        name: "GYM App",
        description: `Subscription for ${plan.title} Plan`,
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
              toast.success("Payment successful! Your subscription is active.");
              // Refresh user data or redirect
              setTimeout(() => {
                window.location.reload();
              }, 2000);
            } else {
              toast.error("Payment verification failed");
            }
          } catch (error) {
            console.error("Payment verification error:", error);
            toast.error(error.response?.data?.error || "Payment verification failed");
          }
        },
        prefill: {
          name: JSON.parse(localStorage.getItem("user") || "{}").name || "",
          email: JSON.parse(localStorage.getItem("user") || "{}").email || "",
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

      // Open Razorpay checkout
      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", function (response) {
        console.error("Payment failed:", response.error);
        toast.error(`Payment failed: ${response.error.description || "Unknown error"}`);
        setLoading(false);
      });
      rzp.open();
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(error.response?.data?.error || "Failed to initiate payment");
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    window.location.href = "/";
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-gray-900 px-4">
      <ToastContainer position="top-right" autoClose={3000} />
      {/* Go Back Button */}
      <button
        onClick={handleLogout}
        className="absolute top-6 left-6 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-md hover:bg-gray-700 transition duration-300"
      >
        ← Go Back
      </button>

      {/* Plans Section */}
      <div className="flex flex-wrap justify-center gap-6 mt-10">
        {plans.map((plan, index) => (
          <div
            key={index}
            className={`w-[260px] bg-gradient-to-tr from-[#975af4] via-[#2f7cf8] to-[#934cff] p-[4px] rounded-[32px] flex flex-col transform hover:scale-105 transition-transform duration-300`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-[18px] py-4 text-white">
              <p
                className={`text-[14px] font-semibold italic ${
                  plan.popular
                    ? "drop-shadow-[2px_2px_6px_#2975ee]"
                    : "opacity-0"
                }`}
              >
                MOST POPULAR
              </p>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                className={`${plan.popular ? "" : "opacity-0"}`}
              >
                <path
                  fill="currentColor"
                  d="M10.277 16.515c.005-.11.187-.154.24-.058c.254.45.686 1.111 1.177 1.412c.49.3 1.275.386 1.791.408c.11.005.154.186.058.24c-.45.254-1.111.686-1.412 1.176s-.386 1.276-.408 1.792c-.005.11-.187.153-.24.057c-.254-.45-.686-1.11-1.176-1.411s-1.276-.386-1.792-.408c-.11-.005-.153-.187-.057-.24c.45-.254 1.11-.686 1.411-1.177c.301-.49.386-1.276.408-1.791m8.215-1c-.008-.11-.2-.156-.257-.062c-.172.283-.421.623-.697.793s-.693.236-1.023.262c-.11.008-.155.2-.062.257c.283.172.624.42.793.697s.237.693.262 1.023c.009.11.2.155.258.061c.172-.282.42-.623.697-.792s.692-.237 1.022-.262c.11-.009.156-.2.062-.258c-.283-.172-.624-.42-.793-.697s-.236-.692-.262-1.022"
                ></path>
              </svg>
            </div>

            {/* Card Content */}
            <div className="w-full h-full bg-[#161a20] rounded-[30px] text-[#838383] text-[12px] p-[18px] flex flex-col gap-[14px]">
              <p className="font-semibold text-[#bab9b9]">{plan.title}</p>

              <p className="flex flex-col leading-tight">
                <span className="text-[36px] text-white">₹{plan.price}</span>
                <span>/ {plan.duration ? `${plan.duration} days` : "month"}</span>
              </p>

              <p className="text-[#bab9b9]">{plan.description}</p>

              <button
                onClick={() => handlePayment(plan)}
                disabled={loading}
                className={`${
                  plan.popular
                    ? "bg-gradient-to-br from-[#975af4] via-[#2f7cf8] to-[#934cff]"
                    : "bg-gray-700"
                } p-2 w-full rounded-lg text-white/80 text-[12px] transition-all duration-300 ease-in-out cursor-pointer shadow-inner hover:text-white hover:scale-105 active:scale-100 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading ? "Processing..." : plan.buttonText}
              </button>

              {/* Separator */}
              <div className="flex items-center gap-2 text-[10px] text-gray-500/50">
                <div className="flex-1 h-[1px] bg-gray-500/50"></div>
                <p>FEATURES</p>
                <div className="flex-1 h-[1px] bg-gray-500/50"></div>
              </div>

              {/* Features List */}
              <div className="text-[#bab9b9] flex flex-col gap-2">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <svg
                      viewBox="0 0 24 24"
                      height="14"
                      width="14"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <g
                        strokeWidth="2"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                      >
                        <rect
                          rx="4"
                          y="3"
                          x="3"
                          height="18"
                          width="18"
                        ></rect>
                        <path d="m9 12l2.25 2L15 10"></path>
                      </g>
                    </svg>
                    <p>{feature}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-center mt-6">
        <button
          onClick={() => window.location.reload()}
          className="bg-gray-800 text-white px-4 py-2 rounded-lg shadow-md hover:bg-gray-700 transition duration-300"
        >
          Already have plan?
        </button>
      </div>
    </div>
  );
};

export default UserPlans;
