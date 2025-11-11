import React, { useState, useEffect } from "react";

const DEMO_OWNER = {
  username: "GYM Owner",
  email: "gym@mail.com",
  subscriptionPlan: "Premium Plan",
  subscriptionExpiry: "2025-12-31",
};
const DEMO_MEMBERS = [
  { id: 1, name: "Aarav Kumar", status: "Active", plan: "Gold Plan" },
  { id: 2, name: "Riya Patel", status: "Expired", plan: "Silver Plan" },
  { id: 3, name: "Aditya Singh", status: "Active", plan: "Basic Plan" },
];
const DEMO_PAYMENTS = [
  { id: 1, member: "Aarav Kumar", amount: 1200, date: "2025-11-05" },
  { id: 2, member: "Riya Patel", amount: 900, date: "2025-10-15" },
];

const OwnerDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [owner] = useState(DEMO_OWNER);
  const [members] = useState(DEMO_MEMBERS);
  const [payments] = useState(DEMO_PAYMENTS);

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
            localStorage.removeItem("role");
            window.location.reload();
          }}
          className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
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

      {/* Members */}
      <section className="bg-white rounded-xl shadow p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Members</h2>
        <div className="grid md:grid-cols-3 sm:grid-cols-2 gap-4">
          {members.map((m) => (
            <div
              key={m.id}
              className="p-5 rounded-lg shadow-md bg-gradient-to-br from-blue-50 to-white border hover:shadow-lg transition-all"
            >
              <h3 className="text-lg font-semibold">{m.name}</h3>
              <p className="text-gray-600">Plan: {m.plan}</p>
              <p className={`mt-2 font-medium ${m.status === "Active" ? "text-green-600" : "text-red-500"}`}>
                {m.status}
              </p>
              <button className="mt-3 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                Pay Now
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Payments */}
      <section className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Payments</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-700 text-left">
                <th className="p-3 border-b">Member</th>
                <th className="p-3 border-b">Amount</th>
                <th className="p-3 border-b">Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="p-3 border-b">{p.member}</td>
                  <td className="p-3 border-b">₹{p.amount}</td>
                  <td className="p-3 border-b">{p.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default OwnerDashboard;
