import { supabase } from "../config/db.js";

export async function profile(req, res) {
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select("id,name,email,role,plan,credits,created_at,updated_at")
      .eq("id", req.user.id)
      .maybeSingle();

    if (error) throw error;

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json({ user });
  } catch (error) {
    console.error("Profile error:", error);

    res.status(500).json({
      message: "Failed to load profile",
    });
  }
}

export async function history(req, res) {
  try {
    const { data, error } = await supabase
      .from("generations")
      .select("*")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({
      generations: data || [],
    });
  } catch (error) {
    console.error("History error:", error);

    res.status(500).json({
      message: "Failed to load history",
    });
  }
}

export async function favorites(req, res) {
  try {
    const { data, error } = await supabase
      .from("favorites")
      .select("*")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({
      favorites: data || [],
    });
  } catch (error) {
    console.error("Favorites error:", error);

    res.status(500).json({
      message: "Failed to load favorites",
    });
  }
}

export async function usage(req, res) {
  try {
    const { data, error } = await supabase
      .from("generations")
      .select("id")
      .eq("user_id", req.user.id);

    if (error) throw error;

    const generations = data?.length || 0;

    res.json({
      creditsUsed: 0,
      generations,
    });
  } catch (error) {
    console.error("Usage error:", error);

    res.status(500).json({
      message: "Failed to load usage",
    });
  }
}