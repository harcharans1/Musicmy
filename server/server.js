import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import { connectDB } from "./config/db.js";

import authRoutes from "./routes/auth.js";
import toolRoutes from "./routes/tools.js";
import aiRoutes from "./routes/ai.js";
import userRoutes from "./routes/user.js";
import paymentRoutes from "./routes/payment.js";
import adminRoutes from "./routes/admin.js";
import savedOutputRoutes from "./routes/savedOutputs.js";
import contentRoutes from "./routes/content.js";

const app = express();

app.use(helmet());

const allowedOrigins = String(process.env.CLIENT_URL || "http://localhost:5173").split(",").map((x) => x.trim()).filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error("Not allowed by CORS")
      );
    },
    credentials: false,
  })
);

app.use(
  express.json({
    limit: "2mb",
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "AIForge API is running",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/tools", toolRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/user", userRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/saved-outputs", savedOutputRoutes);
app.use("/api/content", contentRoutes);

app.use((err, req, res, next) => {
  console.error(err);

  res.status(err.status || 500).json({
    success: false,
    message:
      err.message || "Internal server error.",
  });
});

const PORT = process.env.PORT || 5000;

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.warn("JWT_SECRET should be at least 32 characters in production.");
}

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`AIForge server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Database connection failed:", error);
    process.exit(1);
  });
