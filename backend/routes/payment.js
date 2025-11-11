const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Payment = require("../models/Payment");
const User = require("../models/User");
const Member = require("../models/Member");
const auth = require("../middleware/auth");
require("dotenv").config();

// Plan durations in days
const PLAN_DURATIONS = {
  basic: 30,
  pro: 90,
  premium: 365,
};

// Helper function to check if subscription is active
const isSubscriptionActive = (subscriptionValidTill) => {
  if (!subscriptionValidTill) return false;
  return new Date(subscriptionValidTill) > new Date();
};

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
      const duration = PLAN_DURATIONS[planId] || 30;
      
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

// GET /api/payment/subscription/status
router.get("/subscription/status", auth, async (req, res) => {
  try {
    const userId = req.userId;
    
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if subscription is active
    const isActive = isSubscriptionActive(user.subscriptionValidTill);
    
    // If subscription is active, return the details
    if (isActive) {
      // Find the most recent payment for this user
      const latestPayment = await Payment.findOne({
        user: userId,
        isSubscription: true,
        status: "paid"
      }).sort({ createdAt: -1 });

      return res.json({
        isActive: true,
        validTill: user.subscriptionValidTill,
        planId: latestPayment?.planId || null,
        daysRemaining: Math.ceil((new Date(user.subscriptionValidTill) - new Date()) / (1000 * 60 * 60 * 24))
      });
    }

    // If no active subscription
    return res.json({
      isActive: false,
      message: "No active subscription found"
    });
  } catch (err) {
    console.error("Subscription status check error:", err);
    return res.status(500).json({ 
      error: "Failed to check subscription status", 
      details: err.message 
    });
  }
});

// GET /api/payments/recent - Get recent payments for dashboard
router.get('/recent', auth, async (req, res) => {
  try {
    // Get the last 10 payments, sorted by most recent
    const payments = await Payment.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('user', 'name email')
      .populate('member', 'name');

    const formattedPayments = payments.map(payment => ({
      id: payment._id,
      member: payment.member?.name || payment.user?.name || 'Guest',
      user: payment.user?.name || 'Guest',
      amount: payment.amount,
      date: payment.createdAt.toISOString().split('T')[0],
      status: payment.status,
      plan: payment.planId || 'One-time Payment',
      paymentMethod: 'Card' // Default, you can update this based on your payment method tracking
    }));

    res.json(formattedPayments);
  } catch (err) {
    console.error('Error fetching recent payments:', err);
    res.status(500).json({ error: 'Failed to fetch recent payments', details: err.message });
  }
});

module.exports = router;
