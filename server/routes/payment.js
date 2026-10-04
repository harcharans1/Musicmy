import { Router } from "express";
import {
  createPayment,
  verifyPayment,
  webhook,
} from "../controllers/paymentController.js";
import { protect } from "../middleware/auth.js";
import {
  getPaymentConfig,
  submitPaymentRequest,
  myPaymentRequests,
  adminPaymentRequests,
  approvePaymentRequest,
  rejectPaymentRequest,
} from "../controllers/manualPaymentController.js";

const router = Router();

// Manual UPI payment flow
router.get("/config", getPaymentConfig);
router.post("/request", protect, submitPaymentRequest);
router.get("/my-requests", protect, myPaymentRequests);

// Admin verification
router.get("/admin/requests", protect, adminPaymentRequests);
router.post(
  "/admin/requests/:id/approve",
  protect,
  approvePaymentRequest
);
router.post(
  "/admin/requests/:id/reject",
  protect,
  rejectPaymentRequest
);

// Existing Razorpay endpoints can remain available if needed.
router.post("/create", protect, createPayment);
router.post("/verify", protect, verifyPayment);
router.post("/webhook", webhook);

export default router;
