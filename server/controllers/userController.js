import { supabase } from "../config/db.js";

export async function profile(req, res) {
  try {
    const { data: user, error } = await supabase
      .from("users")
      .select(
        "id,name,email,role,plan,credits,created_at,updated_at"
      )
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
        .select(
          "id,name,email,role,plan,credits,created_at,updated_at"
        )
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
      .select(
        "id,title,content,question,answer,slug,status,amount,provider,created_at"
      )
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

export async function deleteHistory(req, res) {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("generations")
      .delete()
      .eq("id", id)
      .eq("user_id", req.user.id);

    if (error) throw error;

    res.json({
      success: true,
      message:
        "History deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete history error:",
      error
    );

    res.status(500).json({
      message: "Failed to delete history",
    });
  }
}

/* =========================
   FAVORITES
========================= */

export async function favorites(req, res) {
  try {
    const {
      data: favoriteRows,
      error,
    } = await supabase
      .from("favorites")
      .select(
        "id,generation_id,created_at"
      )
      .eq("user_id", req.user.id)
      .order("created_at", {
        ascending: false,
      });

    if (error) throw error;

    const generationIds =
      (favoriteRows || [])
        .map(
          (item) =>
            item.generation_id
        )
        .filter(Boolean);

    if (!generationIds.length) {
      return res.json({
        favorites: [],
      });
    }

    const {
      data: generations,
      error: generationError,
    } = await supabase
      .from("generations")
      .select(
        "id,title,content,question,answer,slug,status,amount,provider,created_at"
      )
      .in("id", generationIds)
      .eq("user_id", req.user.id);

    if (generationError) {
      throw generationError;
    }

    const generationMap = new Map(
      (generations || []).map(
        (item) => [
          item.id,
          item,
        ]
      )
    );

    const result =
      (favoriteRows || [])
        .map((favorite) => ({
          ...favorite,
          generation:
            generationMap.get(
              favorite.generation_id
            ) || null,
        }))
        .filter(
          (item) => item.generation
        );

    res.json({
      favorites: result,
    });
  } catch (error) {
    console.error(
      "Favorites error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to load favorites",
    });
  }
}

/* =========================
   ADD FAVORITE
========================= */

export async function addFavorite(req, res) {
  try {
    const { generationId } =
      req.body;

    if (!generationId) {
      return res.status(400).json({
        message:
          "Generation ID is required",
      });
    }

    const {
      data: generation,
      error: generationError,
    } = await supabase
      .from("generations")
      .select("id")
      .eq("id", generationId)
      .eq("user_id", req.user.id)
      .maybeSingle();

    if (generationError) {
      throw generationError;
    }

    if (!generation) {
      return res.status(404).json({
        message:
          "Generation not found",
      });
    }

    const {
      data,
      error,
    } = await supabase
      .from("favorites")
      .upsert(
        {
          user_id: req.user.id,
          generation_id:
            generationId,
        },
        {
          onConflict:
            "user_id,generation_id",
        }
      )
      .select(
        "id,generation_id,created_at"
      )
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message:
        "Added to favorites",
      favorite: data,
    });
  } catch (error) {
    console.error(
      "Add favorite error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to add favorite",
    });
  }
}

/* =========================
   REMOVE FAVORITE
========================= */

export async function removeFavorite(req, res) {
  try {
    const { id } = req.params;

    const { error } =
      await supabase
        .from("favorites")
        .delete()
        .eq("id", id)
        .eq(
          "user_id",
          req.user.id
        );

    if (error) throw error;

    res.json({
      success: true,
      message:
        "Removed from favorites",
    });
  } catch (error) {
    console.error(
      "Remove favorite error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to remove favorite",
    });
  }
}

/* =========================
   USAGE
========================= */

export async function usage(req, res) {
  try {
    /*
     * Get user credits + plan
     * and complete generation history
     * at the same time.
     */
    const [
      userResult,
      generationsResult,
    ] = await Promise.all([
      supabase
        .from("users")
        .select("credits,plan")
        .eq("id", req.user.id)
        .maybeSingle(),

      supabase
        .from("generations")
        .select(
          "id,amount,created_at,title,slug,status,provider"
        )
        .eq("user_id", req.user.id)
        .order("created_at", {
          ascending: false,
        }),
    ]);

    /*
     * Check user query error.
     */
    if (userResult.error) {
      throw userResult.error;
    }

    /*
     * Check generation query error.
     */
    if (generationsResult.error) {
      throw generationsResult.error;
    }

    /*
     * User must exist.
     */
    if (!userResult.data) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const generations =
      generationsResult.data || [];

    /*
     * Calculate total credits used.
     */
    const creditsUsed =
      generations.reduce(
        (total, item) =>
          total +
          Number(item.amount || 0),
        0
      );

    /*
     * Current credits directly
     * from users table.
     */
    const creditsRemaining =
      Number(
        userResult.data.credits || 0
      );

    /*
     * Current user plan.
     */
    const plan =
      userResult.data.plan ||
      "free";

    /*
     * Send complete usage response.
     */
    res.json({
      creditsRemaining,
      creditsUsed,
      generations:
        generations.length,
      plan,
      history: generations,
    });
  } catch (error) {
    console.error(
      "Usage error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to load usage",
    });
  }
}
export async function updateProfile(req, res) {
  try {
    const { name, email, currentPassword, newPassword } = req.body || {};
    const updates = {};
    if (name !== undefined) {
      const cleanName = String(name).trim();
      if (cleanName.length < 2 || cleanName.length > 80) return res.status(400).json({ message: "Name must be between 2 and 80 characters." });
      updates.name = cleanName;
    }
    if (email !== undefined) {
      const cleanEmail = String(email).trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return res.status(400).json({ message: "Enter a valid email address." });
      const { data: duplicate } = await supabase.from("users").select("id").eq("email", cleanEmail).neq("id", req.user.id).maybeSingle();
      if (duplicate) return res.status(409).json({ message: "Email is already in use." });
      updates.email = cleanEmail;
    }
    if (newPassword) {
      if (!currentPassword) return res.status(400).json({ message: "Current password is required." });
      if (String(newPassword).length < 6) return res.status(400).json({ message: "New password must be at least 6 characters." });
      const bcrypt = await import("bcryptjs");
      const { data: current } = await supabase.from("users").select("password").eq("id", req.user.id).single();
      const ok = await bcrypt.compare(String(currentPassword), current?.password || "");
      if (!ok) return res.status(401).json({ message: "Current password is incorrect." });
      updates.password = await bcrypt.hash(String(newPassword), 12);
    }
    if (!Object.keys(updates).length) return res.status(400).json({ message: "No profile changes provided." });
    updates.updated_at = new Date().toISOString();
    const { data, error } = await supabase.from("users").update(updates).eq("id", req.user.id).select("id,name,email,role,plan,credits,created_at,updated_at").single();
    if (error) throw error;
    res.json({ success: true, message: "Profile updated successfully.", user: data });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Failed to update profile." });
  }
}
