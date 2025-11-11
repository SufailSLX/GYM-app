const mongoose = require("mongoose");

const MemberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  payments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Payment" }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Member", MemberSchema);
