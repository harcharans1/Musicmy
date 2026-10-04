import crypto from "crypto";
import { supabase } from "../config/supabase.js";

const RAZORPAY_BASE_URL = "https://api.razorpay.com/v1";

function getRazorpayAuth() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials are not configured.");
  }

  return Buffer.from(`${keyId}:${keySecret}`).toString("base64");
}

async function razorpayRequest(path, options = {}) {
  const response = await fetch(`${RAZORPAY_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Basic ${getRazorpayAuth()}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      data?.error?.description ||
      data?.error?.reason ||
      "Razorpay API request failed.";

    const error = new Error(message);
    error.status = response.status;
    error.razorpay = data;
    throw error;
  }

  return data;
}

function signatureMatches(payload, signature, secret) {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(String(signature || ""));

  return (
    expectedBuffer.length === receivedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
  );
}

export async function createPayment(req, res) {
  try {
    const planId = process.env.RAZORPAY_PLAN_ID;

    if (!planId) {
      return res.status(500).json({
        success: false,
        message: "Razorpay plan is not configured on the server.",
      });
    }

    const currentPlan = String(req.user?.plan || "free").toLowerCase();

    if (
      req.user?.role === "admin" ||
      currentPlan === "pro" ||
      currentPlan === "premium"
    ) {
      return res.status(400).json({
        success: false,
        message: "Your account already has Pro access.",
      });
    }

    const subscription = await razorpayRequest("/subscriptions", {
      method: "POST",
      body: JSON.stringify({
        plan_id: planId,
        total_count: 12,
        quantity: 1,
        customer_notify: 1,
        notes: {
          user_id: String(req.user.id),
          email: req.user.email || "",
          product: "AIForge Pro",
        },
      }),
    });

    return res.json({
      success: true,
      keyId: process.env.RAZORPAY_KEY_ID,
      subscriptionId: subscription.id,
      status: subscription.status,
    });
  } catch (error) {
    console.error("Razorpay create subscription error:", error);

    return res.status(error.status || 500).json({
      success: false,
      message:
        error.message || "Unable to create Razorpay subscription.",
    });
  }
}

export async function verifyPayment(req, res) {
  try {
    const {
      razorpay_subscription_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body || {};

    if (
      !razorpay_subscription_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment verification details are missing.",
      });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
      return res.status(500).json({
        success: false,
        message: "Razorpay secret is not configured.",
      });
    }

    const payload =
      `${razorpay_subscription_id}|${razorpay_payment_id}`;

    const valid = signatureMatches(
      payload,
      razorpay_signature,
      keySecret
    );

    if (!valid) {
      return res.status(400).json({
        success: false,
        message: "Invalid Razorpay payment signature.",
      });
    }

    const { data: updatedUser, error } = await supabase
      .from("users")
      .update({
        plan: "pro",
      })
      .eq("id", req.user.id)
      .select("id, email, plan")
      .single();

    if (error) {
      console.error("Supabase subscription update error:", error);

      return res.status(500).json({
        success: false,
        message: "Payment verified but account upgrade failed.",
      });
    }

    return res.json({
      success: true,
      message: "Payment verified. Pro access activated.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Razorpay verify error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Payment verification failed.",
    });
  }
}

export async function webhook(req, res) {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];

    if (!secret) {
      return res.status(500).json({
        success: false,
        message: "Webhook secret is not configured.",
      });
    }

    if (!signature) {
      return res.status(400).json({
        success: false,
        message: "Webhook signature is missing.",
      });
    }

    const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body));

    const valid = signatureMatches(
      rawBody,
      signature,
      secret
    );

    if (!valid) {
      return res.status(400).json({
        success: false,
        message: "Invalid webhook signature.",
      });
    }

    const event = req.body?.event;
    const subscription = req.body?.payload?.subscription?.entity;

    const userId =
      subscription?.notes?.user_id ||
      req.body?.payload?.payment?.entity?.notes?.user_id;

    if (!userId) {
      return res.json({
        success: true,
        received: true,
        message: "Webhook received without a mapped user.",
      });
    }

    if (
      event === "subscription.activated" ||
      event === "subscription.charged"
    ) {
      const { error } = await supabase
        .from("users")
        .update({ plan: "pro" })
        .eq("id", userId);

      if (error) {
        console.error("Webhook activation update error:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to activate Pro.",
        });
      }
    }

    if (
      event === "subscription.cancelled" ||
      event === "subscription.completed"
    ) {
      const { error } = await supabase
        .from("users")
        .update({ plan: "free" })
        .eq("id", userId);

      if (error) {
        console.error("Webhook downgrade update error:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to update subscription status.",
        });
      }
    }

    return res.json({
      success: true,
      received: true,
    });
  } catch (error) {
    console.error("Razorpay webhook error:", error);

    return res.status(500).json({
      success: false,
      message: "Webhook processing failed.",
    });
  }
}
