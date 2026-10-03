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

    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const { data: user, error } = await supabase
      .from("users")
      .select(
        "id,name,email,role,plan,credits,created_at,updated_at"
      )
      .eq("id", payload.id)
      .maybeSingle();

    if (error) throw error;

    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
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