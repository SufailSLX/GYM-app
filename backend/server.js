require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const plansRoute = require("./routes/plans");
const paymentRoute = require("./routes/payment");
const authRoute = require("./routes/auth");

const app = express();

// ✅ Connect to MongoDB
connectDB();

// ✅ Define allowed origins
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:5173",
  "http://127.0.0.1:5173",
];

// ✅ CORS configuration - Simplified for development
app.use((req, res, next) => {
  // Allow all origins for development
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// ✅ Parse JSON bodies
app.use(express.json());

// ✅ API Routes
app.use("/api/auth", authRoute);
app.use("/api/plans", plansRoute);
app.use("/api/payment", paymentRoute);

// ✅ Test Route
app.get("/", (req, res) => {
  res.send("🚀 API is running...");
});

// ✅ Start the server
const PORT = 3000; // Force port 3000 to avoid AirPlay conflict
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server started on port ${PORT} | http://localhost:${PORT}`);
});