const PREMIUM_TOOLS = new Set([
  "ai-image-generator",
  "code-generator",
  "code-explainer",
  "resume-builder",
]);

const PRO_PLANS = new Set([
  "pro",
  "premium",
]);

export function premiumTool(req, res, next) {
  const slug =
    req.body?.slug ||
    req.params?.slug ||
    null;

  // Admin gets full access
  if (req.user?.role === "admin") {
    return next();
  }

  // Normal/free tools
  if (!PREMIUM_TOOLS.has(slug)) {
    return next();
  }

  const plan =
    String(req.user?.plan || "free")
      .toLowerCase();

  // Only valid Pro plans are allowed
  if (!PRO_PLANS.has(plan)) {
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
  // Admin bypass
  if (req.user?.role === "admin") {
    return next();
  }

  const plan =
    String(req.user?.plan || "free")
      .toLowerCase();

  if (!PRO_PLANS.has(plan)) {
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