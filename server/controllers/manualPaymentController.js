import { supabase } from "../config/db.js";

const PRO_PRICE = 499;

function requireUser(req, res) {
  if (!req.user?.id) {
    res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
    return false;
  }
  return true;
}

function requireAdmin(req, res) {
  if (req.user?.role !== "admin") {
    res.status(403).json({
      success: false,
      message: "Admin access required.",
    });
    return false;
  }
  return true;
}

export async function getPaymentConfig(req, res) {
  return res.json({
    success: true,
    amount: PRO_PRICE,
    currency: "INR",
    upiId: process.env.UPI_ID || "",
    merchantName: process.env.UPI_MERCHANT_NAME || "AIForge",
    plan: "pro",
    duration: "1 month",
  });
}

export async function submitPaymentRequest(req, res) {
  if (!requireUser(req, res)) return;

  const {
    utr,
    screenshotUrl = null,
    note = "",
  } = req.body || {};

  const cleanUtr = String(utr || "").trim();

  if (!cleanUtr || cleanUtr.length < 6 || cleanUtr.length > 80) {
    return res.status(400).json({
      success: false,
      message: "Please enter a valid UTR / transaction ID.",
    });
  }

  const plan = String(req.user?.plan || "free").toLowerCase();

  if (req.user.role === "admin" || plan === "pro" || plan === "premium") {
    return res.status(400).json({
      success: false,
      message: "Your account already has Pro access.",
    });
  }

  const { data: existing, error: existingError } = await supabase
    .from("payment_requests")
    .select("id,status")
    .eq("user_id", req.user.id)
    .eq("utr", cleanUtr)
    .maybeSingle();

  if (existingError) {
    console.error("Payment request lookup error:", existingError);
    return res.status(500).json({
      success: false,
      message: "Unable to submit payment request.",
    });
  }

  if (existing) {
    return res.status(409).json({
      success: false,
      message: "This transaction has already been submitted.",
      request: existing,
    });
  }

  const { data, error } = await supabase
    .from("payment_requests")
    .insert({
      user_id: req.user.id,
      amount: PRO_PRICE,
      currency: "INR",
      plan: "pro",
      utr: cleanUtr,
      screenshot_url: screenshotUrl,
      note: String(note || "").trim().slice(0, 500),
      status: "pending",
    })
    .select("*")
    .single();

  if (error) {
    console.error("Payment request insert error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to submit payment request.",
    });
  }

  return res.status(201).json({
    success: true,
    message: "Payment request submitted. Pro will be activated after admin verification.",
    request: data,
  });
}

export async function myPaymentRequests(req, res) {
  if (!requireUser(req, res)) return;

  const { data, error } = await supabase
    .from("payment_requests")
    .select("*")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Payment history error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load payment requests.",
    });
  }

  return res.json({
    success: true,
    requests: data || [],
  });
}

export async function adminPaymentRequests(req, res) {
  if (!requireUser(req, res) || !requireAdmin(req, res)) return;

  const status = String(req.query.status || "pending").toLowerCase();
  const allowed = ["pending", "approved", "rejected", "all"];

  if (!allowed.includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid payment request status.",
    });
  }

  let query = supabase
    .from("payment_requests")
    .select(`
      *,
      users:user_id (
        id,
        email,
        name,
        plan
      )
    `)
    .order("created_at", { ascending: false });

  if (status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Admin payment list error:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to load payment requests.",
    });
  }

  return res.json({
    success: true,
    requests: data || [],
  });
}

export async function approvePaymentRequest(req, res) {
  if (!requireUser(req, res) || !requireAdmin(req, res)) return;

  const id = String(req.params.id || "").trim();

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Payment request ID is required.",
    });
  }

  const { data: request, error: requestError } = await supabase
    .from("payment_requests")
    .select("*")
    .eq("id", id)
    .single();

  if (requestError || !request) {
    return res.status(404).json({
      success: false,
      message: "Payment request not found.",
    });
  }

  if (request.status !== "pending") {
    return res.status(409).json({
      success: false,
      message: `Request is already ${request.status}.`,
    });
  }

  const { data: updatedUser, error: userError } = await supabase
    .from("users")
    .update({ plan: "pro" })
    .eq("id", request.user_id)
    .select("id,email,name,plan")
    .single();

  if (userError) {
    console.error("Admin user upgrade error:", userError);
    return res.status(500).json({
      success: false,
      message: "Could not activate Pro for this user.",
    });
  }

  const { data: updatedRequest, error: updateError } = await supabase
    .from("payment_requests")
    .update({
      status: "approved",
      reviewed_by: req.user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "pending")
    .select("*")
    .single();

  if (updateError) {
    console.error("Admin payment approval error:", updateError);
    return res.status(500).json({
      success: false,
      message: "User was upgraded but payment request status could not be updated.",
    });
  }

  return res.json({
    success: true,
    message: "Payment approved and Pro activated.",
    request: updatedRequest,
    user: updatedUser,
  });
}

export async function rejectPaymentRequest(req, res) {
  if (!requireUser(req, res) || !requireAdmin(req, res)) return;

  const id = String(req.params.id || "").trim();
  const reason = String(req.body?.reason || "").trim().slice(0, 500);

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Payment request ID is required.",
    });
  }

  const { data, error } = await supabase
    .from("payment_requests")
    .update({
      status: "rejected",
      rejection_reason: reason || "Payment could not be verified.",
      reviewed_by: req.user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "pending")
    .select("*")
    .single();

  if (error || !data) {
    console.error("Admin payment rejection error:", error);
    return res.status(404).json({
      success: false,
      message: "Pending payment request not found.",
    });
  }

  return res.json({
    success: true,
    message: "Payment request rejected.",
    request: data,
  });
}
