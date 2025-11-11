import React, { useState } from "react";

const dummyMembers = [
  { _id: "1", name: "John Doe", email: "john@example.com" },
  { _id: "2", name: "Jane Smith", email: "jane@example.com" },
];

const MembersPage = () => {
  const [members] = useState(dummyMembers);

  const handlePay = (member) => {
    console.log("Paying for member:", member);
    // Razorpay payment logic goes here
  };

  return (
    <div>
      <h2>Gym Members</h2>
      <ul>
        {members.map((member) => (
          <li key={member._id} style={{ marginBottom: 16 }}>
            <strong>{member.name}</strong> ({member.email})
            <button style={{ marginLeft: 12 }} onClick={() => handlePay(member)}>
              Pay Now
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MembersPage;
