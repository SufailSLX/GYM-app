const mongoose = require("mongoose");

const PaymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  currency: { type: String, default: "INR" },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  member: { type: mongoose.Schema.Types.ObjectId, ref: "Member" }, // Null for subscriptions
  isSubscription: { type: Boolean, default: false },
  planId: { type: String }, // For subscription plans (basic, pro, premium)
  razorpayOrderId: { type: String, required: true },
  razorpayPaymentId: { type: String },
  status: { type: String, enum: ["created", "paid", "failed"], default: "created" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Payment", PaymentSchema);
