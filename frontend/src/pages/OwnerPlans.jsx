import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const OwnerPlans = () => {
  const [activeTab, setActiveTab] = useState("monthly");
  const navigate = useNavigate();

  const handleGoBack = () => {
    // Clear authentication state
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    // Force a full page reload to reset the app state
    window.location.href = '/login';
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
              <sup className="text-[13px]">INR</sup>9
              <sub className="absolute bottom-[5px] text-[11px] text-[#5F5D6B]">
                /mo
              </sub>
            </label>

            <button
              type="button"
              className="flex justify-center items-center w-[215px] h-[40px] bg-[#0bdd12] hover:bg-[#07b90d] text-white font-semibold text-[13px] rounded-md shadow-[0px_1px_1px_rgba(239,239,239,0.5)] transition-all duration-300"
            >
              Upgrade to PRO
            </button>
          </div>
        </form>

        {/* Go Back Button */}
        <div className="flex justify-center pb-5">
          <button
            onClick={handleGoBack}
            className="mt-3 w-[200px] h-[38px] border border-gray-300 text-gray-700 hover:text-black hover:border-gray-400 rounded-md font-medium text-[13px] transition-all duration-300"
          >
            Go Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default OwnerPlans;
