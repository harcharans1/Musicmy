import { Router } from "express";
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

// User payment
router.get("/config", getPaymentConfig);

router.post(
  "/request",
  protect,
  submitPaymentRequest
);

router.get(
  "/my-requests",
  protect,
  myPaymentRequests
);

// Admin payment verification
router.get(
  "/admin/requests",
  protect,
  adminPaymentRequests
);

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

export default router;