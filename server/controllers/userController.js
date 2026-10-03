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

/* =========================
   LIVE DASHBOARD
========================= */

export async function dashboard(req, res) {
  try {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [
      userResult,
      generationsCountResult,
      savedCountResult,
      favoritesCountResult,
      recentResult,
      monthResult,
    ] = await Promise.all([
      supabase
        .from("users")
        .select("id,name,email,role,plan,credits,created_at,updated_at")
        .eq("id", req.user.id)
        .maybeSingle(),

      supabase
        .from("generations")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("user_id", req.user.id),

      supabase
        .from("saved_outputs")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("user_id", req.user.id),

      supabase
        .from("favorites")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("user_id", req.user.id),

      supabase
        .from("generations")
        .select(
          "id,title,slug,amount,status,created_at"
        )
        .eq("user_id", req.user.id)
        .order("created_at", {
          ascending: false,
        })
        .limit(5),

      supabase
        .from("generations")
        .select("amount")
        .eq("user_id", req.user.id)
        .gte(
          "created_at",
          monthStart.toISOString()
        ),
    ]);

    const errors = [
      userResult.error,
      generationsCountResult.error,
      savedCountResult.error,
      favoritesCountResult.error,
      recentResult.error,
      monthResult.error,
    ].filter(Boolean);

    if (errors.length) {
      throw errors[0];
    }

    const user = userResult.data;

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const creditsUsedThisMonth =
      (monthResult.data || []).reduce(
        (total, row) =>
          total + Number(row.amount || 0),
        0
      );

    const creditsRemaining =
      Number(user.credits || 0);

    const creditBase =
      creditsRemaining + creditsUsedThisMonth;

    const usagePercent =
      creditBase > 0
        ? Math.min(
            100,
            Math.round(
              (creditsUsedThisMonth /
                creditBase) *
                100
            )
          )
        : 0;

    res.json({
      user,

      stats: {
        creditsRemaining,

        toolsUsed:
          generationsCountResult.count || 0,

        savedOutputs:
          savedCountResult.count || 0,

        favorites:
          favoritesCountResult.count || 0,

        creditsUsedThisMonth,

        creditBase,

        usagePercent,
      },

      recentActivity:
        recentResult.data || [],
    });
  } catch (error) {
    console.error(
      "Dashboard error:",
      error
    );

    res.status(500).json({
      message: "Failed to load dashboard",
    });
  }
}

/* =========================
   HISTORY
========================= */

export async function history(req, res) {
  try {
    const { data, error } = await supabase
      .from("generations")
      .select("*")
      .eq("user_id", req.user.id)
      .order("created_at", {
        ascending: false,
      });

    if (error) throw error;

    res.json({
      generations: data || [],
    });
  } catch (error) {
    console.error(
      "History error:",
      error
    );

    res.status(500).json({
      message: "Failed to load history",
    });
  }
}

/* =========================
   FAVORITES
========================= */

export async function favorites(req, res) {
  try {
    const { data, error } = await supabase
      .from("favorites")
      .select("*")
      .eq("user_id", req.user.id)
      .order("created_at", {
        ascending: false,
      });

    if (error) throw error;

    res.json({
      favorites: data || [],
    });
  } catch (error) {
    console.error(
      "Favorites error:",
      error
    );

    res.status(500).json({
      message: "Failed to load favorites",
    });
  }
}

/* =========================
   USAGE
========================= */

export async function usage(req, res) {
  try {
    const { data, error } = await supabase
      .from("generations")
      .select("id,amount,created_at")
      .eq("user_id", req.user.id)
      .order("created_at", {
        ascending: false,
      });

    if (error) throw error;

    const generations = data || [];

    const creditsUsed = generations.reduce(
      (total, item) =>
        total + Number(item.amount || 0),
      0
    );

    res.json({
      creditsUsed,
      generations: generations.length,
      history: generations,
    });
  } catch (error) {
    console.error(
      "Usage error:",
      error
    );

    res.status(500).json({
      message: "Failed to load usage",
    });
  }
}