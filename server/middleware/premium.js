const PREMIUM_TOOLS = new Set([
  "ai-image-generator",
  "code-generator",
  "code-explainer",
  "resume-builder",
]);

const PRO_PLANS = new Set(["pro", "premium"]);

function hasActivePro(req) {
  if (req.user?.role === "admin") {
    return true;
  }

  const plan = String(req.user?.plan || "").toLowerCase();

  if (!PRO_PLANS.has(plan)) {
    return false;
  }

  const expiry = req.user?.subscription_expires_at;

  if (!expiry) {
    return false;
  }

  const expiryDate = new Date(expiry);

  return (
    !Number.isNaN(expiryDate.getTime()) &&
    expiryDate > new Date()
  );
}

export function premiumTool(req, res, next) {
  const slug =
    req.body?.slug ||
    req.params?.slug ||
    null;

  if (!PREMIUM_TOOLS.has(slug)) {
    return next();
  }

  if (!hasActivePro(req)) {
    return res.status(403).json({
      success: false,
      code: "PREMIUM_REQUIRED",
      message:
        "This tool is available on the Pro plan. Please upgrade your subscription to use it.",
      tool: slug,
      requiredPlan: "pro",
    });
  }

  next();
}

export function requirePro(req, res, next) {
  if (!hasActivePro(req)) {
    return res.status(403).json({
      success: false,
      code: "PREMIUM_REQUIRED",
      message:
        "A Pro subscription is required to use this feature.",
      requiredPlan: "pro",
    });
  }

  next();
}