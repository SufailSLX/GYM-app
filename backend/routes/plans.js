const express = require("express");
const router = express.Router();

// Sample subscription plans
const plans = [
  { id: "basic", name: "Basic", price: 499, duration: 30 },
  { id: "pro", name: "Pro", price: 899, duration: 90 },
  { id: "premium", name: "Premium", price: 1999, duration: 365 },
];

// GET /api/plans
router.get("/", (req, res) => {
  res.json(plans);
});

module.exports = router;
