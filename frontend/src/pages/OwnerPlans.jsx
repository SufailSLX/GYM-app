import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { paymentAPI } from "../services/api";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const OwnerPlans = () => {
  const [activeTab, setActiveTab] = useState("monthly");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        resolve(true);
      };
      script.onerror = () => {
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  const handleUpgrade = async () => {
    try {
      setIsLoading(true);
      
      // Load Razorpay script if not already loaded
      const isRazorpayLoaded = await loadRazorpay();
      if (!isRazorpayLoaded) {
        throw new Error('Failed to load Razorpay SDK');
      }

      // Create payment order
      const orderResponse = await paymentAPI.createOrder({
        amount: 199 * 100,
        currency: 'INR',
        isSubscription: true,
        planId: 'basic'
      });

      // Extract order data from axios response
      const orderData = orderResponse.data;
      console.log('Order created:', orderData);

      // Ensure amount is a number and convert to paise if needed
      // Razorpay expects amount in paise, backend returns it in paise already
      const amountInPaise = typeof orderData.amount === 'number' ? orderData.amount : 199 * 100;
      
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_ReNEKukQGekglb",
        amount: amountInPaise,
        currency: orderData.currency || 'INR',
        name: 'GYM Pro Subscription',
        description: 'Monthly Subscription',
        order_id: orderData.orderId,
        handler: async function (razorpayResponse) {
          try {
            console.log('Razorpay response:', razorpayResponse);
            
            // In test mode, we might not get all the fields
            const verificationData = {
              razorpay_payment_id: razorpayResponse.razorpay_payment_id,
              razorpay_order_id: orderData.orderId, // Use the order ID from the createOrder response
              razorpay_signature: razorpayResponse.razorpay_signature || 'test_signature', // For test mode
              isSubscription: true,
              planId: 'basic',
              amount: orderData.amount, // Use the amount from the order response
              currency: orderData.currency || 'INR'
            };
            
            console.log('Sending verification data:', verificationData);
            
            // Verify payment
            const verificationResponse = await paymentAPI.verifyPayment(verificationData);
            
            console.log('Verification response:', verificationResponse);

            // Update localStorage with subscription data from backend response
            // This ensures frontend and backend are in sync
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            
            if (verificationResponse.data?.subscription) {
              // Use subscription data from backend
              const subscription = verificationResponse.data.subscription;
              const subscriptionValidTill = new Date(subscription.subscriptionValidTill).toISOString();
              
              localStorage.setItem('user', JSON.stringify({
                ...user,
                isSubscribed: subscription.isSubscribed,
                subscriptionValidTill: subscriptionValidTill
              }));
              
              console.log('Updated localStorage with subscription from backend:', {
                isSubscribed: subscription.isSubscribed,
                subscriptionValidTill: subscriptionValidTill,
                planId: subscription.planId,
                daysRemaining: subscription.daysRemaining
              });
            } else {
              // Fallback: calculate subscription if backend doesn't return it (shouldn't happen)
              console.warn('No subscription data in verification response, using fallback');
              const subscriptionValidTill = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
              
              localStorage.setItem('user', JSON.stringify({
                ...user,
                isSubscribed: true,
                subscriptionValidTill: subscriptionValidTill.toISOString()
              }));
            }

            // Update isLegacyOwner in local storage to false since they've now subscribed
            localStorage.setItem('isLegacyOwner', 'false');
            
            toast.success('Payment successful! Redirecting to dashboard...');
            
            // Small delay to ensure localStorage is written
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Force a full page reload to reset the app state
            window.location.href = '/owner/dashboard';
          } catch (error) {
            console.error('Payment verification failed:', error);
            const errorMessage = error.response?.data?.error || error.message || 'Payment verification failed';
            console.error('Error details:', errorMessage);
            
            // Don't proceed if verification fails - payment must be verified in database
            toast.error(`Payment verification failed: ${errorMessage}. Please contact support.`);
          }
        },
        prefill: {
          name: 'Gym Owner',
          email: 'gym@mail.com',
          contact: '+919999999999'
        },
        theme: {
          color: '#0bdd12'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
      
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.response?.data?.error || 'Failed to process payment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    // Clear authentication state
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    // Force a full page reload to reset the app state
    window.location.href = '/login';
  };

  const handleCheckExistingPlan = async () => {
    try {
      setIsLoading(true);
      console.log('Checking for existing subscription...');
      
      // Check if user is authenticated
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login first');
        window.location.href = '/login';
        return;
      }
      
      // Check localStorage first (this is updated immediately after payment)
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      console.log('Stored user from localStorage:', storedUser);
      
      if (storedUser.isSubscribed && storedUser.subscriptionValidTill) {
        // Parse the date string from localStorage
        const validTillDate = new Date(storedUser.subscriptionValidTill);
        const now = new Date();
        const hasActiveSubscription = validTillDate > now;
        
        console.log('LocalStorage subscription check:', {
          isSubscribed: storedUser.isSubscribed,
          subscriptionValidTill: storedUser.subscriptionValidTill,
          validTillDate: validTillDate,
          now: now,
          isActive: hasActiveSubscription,
          timeDiff: validTillDate.getTime() - now.getTime()
        });
        
        if (hasActiveSubscription) {
          // Update isLegacyOwner flag
          localStorage.setItem('isLegacyOwner', 'false');
          console.log('✅ Active subscription found in localStorage, redirecting...');
          toast.success('Active subscription found! Redirecting to dashboard...');
          // Small delay to ensure localStorage is written and toast is shown
          await new Promise(resolve => setTimeout(resolve, 800));
          // Use window.location.href to force full page reload and re-check subscription
          window.location.href = '/owner/dashboard';
          return;
        } else {
          console.log('⚠️ LocalStorage subscription expired');
        }
      } else {
        console.log('⚠️ No subscription data in localStorage');
      }
      
      // If localStorage doesn't have active subscription, check API
      console.log('Checking API for subscription status...');
      try {
        const subscriptionResponse = await paymentAPI.checkSubscription();
        console.log('API subscription response:', subscriptionResponse);
        
        const apiHasSubscription = subscriptionResponse.data && subscriptionResponse.data.isActive;
        console.log('API subscription isActive:', apiHasSubscription);
        
        if (apiHasSubscription) {
          // Update localStorage with API data
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          
          // Handle both Date objects and ISO strings
          let validTill;
          if (subscriptionResponse.data.validTill) {
            validTill = subscriptionResponse.data.validTill instanceof Date 
              ? subscriptionResponse.data.validTill.toISOString()
              : new Date(subscriptionResponse.data.validTill).toISOString();
          }
          
          // Update user object with subscription info
          const updatedUser = {
            ...user,
            isSubscribed: true,
            ...(validTill && { subscriptionValidTill: validTill })
          };
          
          localStorage.setItem('user', JSON.stringify(updatedUser));
          localStorage.setItem('isLegacyOwner', 'false');
          
          console.log('Updated localStorage with API subscription data:', updatedUser);
          console.log('✅ Active subscription found via API, redirecting...');
          
          toast.success('Active subscription found! Redirecting to dashboard...');
          // Small delay to ensure localStorage is written and toast is shown
          await new Promise(resolve => setTimeout(resolve, 800));
          // Use window.location.href to force full page reload and re-check subscription
          window.location.href = '/owner/dashboard';
        } else {
          console.log('❌ No active subscription found in API');
          toast.error('No active subscription found. Please subscribe to continue.');
        }
      } catch (error) {
        console.error('Error checking subscription via API:', error);
        console.error('Error response:', error.response?.data);
        const errorMessage = error.response?.data?.error || error.message || 'Failed to check subscription status';
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error in handleCheckExistingPlan:', error);
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#f3fff5] to-[#ffffff]">
      <div className="w-[450px] bg-gradient-to-b from-[#DCF9E0] to-white rounded-2xl shadow-[0px_187px_75px_rgba(0,0,0,0.01),0px_105px_63px_rgba(0,0,0,0.05),0px_47px_47px_rgba(0,0,0,0.09),0px_12px_26px_rgba(0,0,0,0.1)] p-0">
        <form className="flex flex-col gap-2">
          {/* Expired Notice */}
          <div className="text-center bg-red-50 text-red-600 font-semibold py-2 rounded-t-2xl border-b border-red-200 text-[13px]">
            ⚠️ Your monthly plan has expired! Please subscribe to activate it.
          </div>

          <label className="font-bold text-[17px] text-center text-[#2B2B2F] mt-3 mb-3">
            Get New Pack
          </label>

          <p className="text-center text-[#5F5D6B] text-[11px] font-semibold max-w-[80%] mx-auto leading-[16px]">
            Grow your customer base with our tools — you can reach a much bigger
            and better fan community. Go PRO now!
          </p>

          {/* Tabs */}
          <div className="relative flex items-start bg-[#ebebec] rounded-lg p-[2px] mx-5 mt-3">
            <button
              onClick={() => setActiveTab("monthly")}
              type="button"
              className={`w-1/2 h-[28px] z-[10] font-medium rounded-md transition-all duration-200 ${
                activeTab === "monthly" ? "text-black" : "text-gray-500"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setActiveTab("annual")}
              type="button"
              className={`w-1/2 h-[28px] z-[10] font-medium rounded-md transition-all duration-200 ${
                activeTab === "annual" ? "text-black" : "text-gray-500"
              }`}
            >
              Annual
            </button>

            {/* Animated indicator */}
            <div
              className={`absolute top-[2px] h-[28px] w-[calc(50%-4px)] bg-white border border-black/5 shadow-[0px_3px_8px_rgba(0,0,0,0.12),0px_3px_1px_rgba(0,0,0,0.04)] rounded-md transition-all duration-300 ease-out ${
                activeTab === "monthly" ? "left-[2px]" : "left-[calc(50%+2px)]"
              }`}
            />
          </div>

          {/* Benefits */}
          <div className="flex flex-col gap-5 p-5">
            <span className="text-[15px] text-[#2B2B2F] font-bold">
              What You Get
            </span>
            <ul className="flex flex-col gap-3">
              <li className="flex items-center gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 16 16"
                  height="16"
                  width="16"
                >
                  <rect fill="black" rx="8" height="16" width="16"></rect>
                  <path
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    strokeWidth="1.5"
                    stroke="white"
                    d="M5 8.5L7.5 10.5L11 6"
                  ></path>
                </svg>
                <span className="text-[#5F5D6B] text-[12px] font-semibold">
                  Grow your customer base with our social tools
                </span>
              </li>
              <li className="flex items-center gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 16 16"
                  height="16"
                  width="16"
                >
                  <rect fill="black" rx="8" height="16" width="16"></rect>
                  <path
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    strokeWidth="1.5"
                    stroke="white"
                    d="M5 8.5L7.5 10.5L11 6"
                  ></path>
                </svg>
                <span className="text-[#5F5D6B] text-[12px] font-semibold">
                  Use email automations to promote your products
                </span>
              </li>
            </ul>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center px-5 py-5 border-t border-[#ebebec]">
            <label className="relative text-[32px] text-[#2B2B2F] font-extrabold">
              <sup className="text-[13px]">INR</sup>19,900
              <sub className="absolute bottom-[5px] text-[11px] text-[#5F5D6B]">
                /mo
              </sub>
            </label>

            <button
              type="button"
              onClick={handleUpgrade}
              disabled={isLoading}
              className={`flex justify-center items-center w-[215px] h-[40px] ${isLoading ? 'bg-gray-400' : 'bg-[#0bdd12] hover:bg-[#07b90d]'} text-white font-semibold text-[13px] rounded-md shadow-[0px_1px_1px_rgba(239,239,239,0.5)] transition-all duration-300`}
            >
              {isLoading ? 'Processing...' : 'Upgrade to PRO'}
            </button>
          </div>
        </form>

        {/* Go Back Button */}
        <div className="flex flex-col items-center pb-5">
          <button
            onClick={handleCheckExistingPlan}
            disabled={isLoading}
            className={`mt-3 w-[200px] h-[38px] border border-gray-300 ${isLoading ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:text-black hover:border-gray-400'} rounded-md font-medium text-[13px] transition-all duration-300`}
          >
            {isLoading ? 'Checking...' : 'Already have a plan?'}
          </button>
          <button
            onClick={handleGoBack}
            disabled={isLoading}
            className={`mt-3 w-[200px] h-[38px] border border-gray-300 ${isLoading ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:text-black hover:border-gray-400'} rounded-md font-medium text-[13px] transition-all duration-300`}
          >
            Go Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default OwnerPlans;
