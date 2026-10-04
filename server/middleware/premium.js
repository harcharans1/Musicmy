const PREMIUM_TOOLS = new Set([
  "ai-image-generator",
  "code-generator",
  "code-explainer",
  "resume-builder",
]);

export function premiumTool(req, res, next) {
  const slug =
    req.body?.slug ||
    req.params?.slug ||
    null;

  /*
   * Admin always has access.
   */
  if (req.user?.role === "admin") {
    return next();
  }

  /*
   * Only selected tools require Pro.
   */
  if (!PREMIUM_TOOLS.has(slug)) {
    return next();
  }

  /*
   * Free users cannot access premium tools.
   */
  const plan =
    String(req.user?.plan || "free")
      .toLowerCase();

  if (plan === "free") {
    return res.status(403).json({
      success: false,
      code: "PREMIUM_REQUIRED",
      message:
        "This tool is available on the Pro plan. Please upgrade your subscription to use it.",
      tool: slug,
      requiredPlan: "pro",
    });
  }

  return next();
}

/*
|--------------------------------------------------------------------------
| Dedicated premium route middleware
|--------------------------------------------------------------------------
*/

export function requirePro(req, res, next) {
  if (req.user?.role === "admin") {
    return next();
  }

  const plan =
    String(req.user?.plan || "free")
      .toLowerCase();

  if (
    plan !== "pro" &&
    plan !== "premium"
  ) {
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