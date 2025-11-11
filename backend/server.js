require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const plansRoute = require("./routes/plans");
const paymentRoute = require("./routes/payment");
const authRoute = require("./routes/auth");

const app = express();

// ✅ Connect MongoDB
connectDB();

// ✅ Use CORS properly
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:5173",
  "http://127.0.0.1:5173",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (like mobile apps, curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ✅ Parse JSON bodies
app.use(express.json());

// ✅ Handle preflight for all routes
app.use(cors());

// ✅ Routes
app.use("/api/auth", authRoute);
app.use("/api/plans", plansRoute);
app.use("/api/payment", paymentRoute);

// ✅ Test route
app.get("/", (req, res) => res.send("🚀 API is running..."));

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`✅ Server started on port ${PORT} | http://localhost:${PORT}`)
);
