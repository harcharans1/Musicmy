import jwt from "jsonwebtoken";
import { supabase } from "../config/db.js";

export async function protect(req, res, next) {
  try {
    const header = req.headers.authorization;

    if (!header?.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const token = header.split(" ")[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const { data: user, error } = await supabase
      .from("users")
      .select(`
        id,
        name,
        email,
        role,
        plan,
        credits,
        subscription_started_at,
        subscription_expires_at,
        created_at,
        updated_at
      `)
      .eq("id", payload.id)
      .maybeSingle();

    if (error) throw error;

    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    // Admin always has access
    if (user.role !== "admin") {
      const isPro =
        String(user.plan || "").toLowerCase() === "pro" ||
        String(user.plan || "").toLowerCase() === "premium";

      const expiry = user.subscription_expires_at
        ? new Date(user.subscription_expires_at)
        : null;

      const expired =
        isPro &&
        (!expiry || Number.isNaN(expiry.getTime()) || expiry <= new Date());

      if (expired) {
        const { data: updatedUser, error: updateError } =
          await supabase
            .from("users")
            .update({
              plan: "free",
              subscription_started_at: null,
              subscription_expires_at: null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", user.id)
            .select(`
              id,
              name,
              email,
              role,
              plan,
              credits,
              subscription_started_at,
              subscription_expires_at,
              created_at,
              updated_at
            `)
            .single();

        if (updateError) throw updateError;

        req.user = updatedUser;
        return next();
      }
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth error:", error);

    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
}

export function adminOnly(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({
      message: "Admin access required",
    });
  }

  next();
}