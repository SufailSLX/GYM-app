const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Payment = require("../models/Payment");
const User = require("../models/User");
const Member = require("../models/Member");
const auth = require("../middleware/auth");
require("dotenv").config();

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// POST /api/payment/order
router.post("/order", auth, async (req, res) => {
  try {
    const { amount, currency, memberId, isSubscription, planId } = req.body;
    const userId = req.userId;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const options = {
      amount: Math.round(amount * 100), // Razorpay uses paise
      currency: currency || "INR",
      receipt: `receipt_${Date.now()}`,
    };
    
    const order = await razorpay.orders.create(options);
    
    // Create a payment record in DB with order details
    const payment = await Payment.create({
      amount,
      currency: options.currency,
      user: userId,
      member: memberId || null,
      isSubscription: isSubscription || false,
      planId: planId || null,
      razorpayOrderId: order.id,
      status: "created",
    });

    return res.json({ 
      orderId: order.id, 
      amount: order.amount, 
      currency: order.currency,
      paymentId: payment._id
    });
  } catch (err) {
    console.error("Order creation error:", err);
    return res.status(500).json({ error: "Failed to create order", details: err.message });
  }
});

// POST /api/payment/verify
router.post("/verify", auth, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, memberId, isSubscription, planId } = req.body;
    const userId = req.userId;

    // Verify signature
    const shasum = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    shasum.update(razorpay_order_id + "|" + razorpay_payment_id);
    const digest = shasum.digest("hex");
    
    if (digest !== razorpay_signature) {
      return res.status(400).json({ error: "Invalid payment signature" });
    }

    // Update payment record
    const payment = await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id, user: userId },
      {
        razorpayPaymentId: razorpay_payment_id,
        status: "paid",
      },
      { new: true }
    );

    if (!payment) {
      return res.status(404).json({ error: "Payment record not found" });
    }

    // Handle subscription activation
    if (isSubscription && planId) {
      // Get plan duration from planId
      // This matches the plans in routes/plans.js
      const planDurations = {
        basic: 30,
        pro: 90,
        premium: 365,
      };
      const duration = planDurations[planId] || 30;
      
      // Calculate subscription expiry date
      const subscriptionValidTill = new Date(Date.now() + duration * 24 * 60 * 60 * 1000);
      
      await User.findByIdAndUpdate(userId, {
        isSubscribed: true,
        subscriptionValidTill: subscriptionValidTill,
      });
      
      console.log(`Subscription activated for user ${userId}, valid until ${subscriptionValidTill}`);
    } else if (memberId) {
      // For member payments, append payment to member record
      await Member.findByIdAndUpdate(memberId, {
        $push: { payments: payment._id },
      });
    }

    return res.json({ 
      status: "success", 
      message: "Payment verified successfully",
      payment: {
        id: payment._id,
        amount: payment.amount,
        status: payment.status,
      }
    });
  } catch (err) {
    console.error("Payment verification error:", err);
    return res.status(500).json({ error: "Failed to verify payment", details: err.message });
  }
});

module.exports = router;
