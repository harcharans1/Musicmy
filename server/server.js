import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import { connectDB } from "./config/db.js";
import auth from "./routes/auth.js";
import tools from "./routes/tools.js";
import ai from "./routes/ai.js";
import user from "./routes/user.js";
import payment from "./routes/payment.js";
import admin from "./routes/admin.js";
import { notFound, errorHandler } from "./middleware/error.js";

const app = express();

/* =========================
   SECURITY
========================= */

app.use(helmet());

/* =========================
   CORS
========================= */

const allowedOrigins = [
  "https://musicmyy.netlify.app",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: false,
    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

/* =========================
   BODY PARSER
========================= */

app.use(
  express.json({
    limit: "2mb",
  })
);

/* =========================
   RATE LIMIT
========================= */

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

/* =========================
   HEALTH CHECK
========================= */

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    demoMode: process.env.DEMO_MODE === "true",
  });
});

/* =========================
   API ROUTES
========================= */

app.use("/api/auth", auth);
app.use("/api/tools", tools);
app.use("/api/ai", ai);
app.use("/api/user", user);
app.use("/api/payment", payment);
app.use("/api/admin", admin);

/* =========================
   ERROR HANDLING
========================= */

app.use(notFound);
app.use(errorHandler);

/* =========================
   START SERVER
========================= */

connectDB()
  .then(() => {
    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log(`AIForge API running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Server startup failed:", error);
    process.exit(1);
  });