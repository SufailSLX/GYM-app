import React, { useEffect, useState } from "react";

const SubscriptionPage = () => {
  const [plans, setPlans] = useState([]);
  useEffect(() => {
    fetch("http://localhost:5000/api/plans")
      .then((res) => res.json())
      .then(setPlans)
      .catch((e) => setPlans([]));
  }, []);

  const handleBuy = (plan) => {
    console.log("Buying plan:", plan);
    // Razorpay logic will go here
  };

  return (
    <div>
      <h2>Subscription Plans</h2>
      <ul>
        {plans.map((plan) => (
          <li key={plan.id} style={{ marginBottom: 16 }}>
            <strong>{plan.name}</strong> - ₹{plan.price} for {plan.duration} days
            <button style={{ marginLeft: 12 }} onClick={() => handleBuy(plan)}>
              Buy Now
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SubscriptionPage;
