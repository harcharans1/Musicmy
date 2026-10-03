import { supabase } from "../config/db.js";

export async function dashboard(req, res) {
  try {
    const { count: users, error: usersError } = await supabase
      .from("users")
      .select("id", {
        count: "exact",
        head: true,
      });

    if (usersError) throw usersError;

    const { count: generations, error: generationsError } =
      await supabase
        .from("generations")
        .select("id", {
          count: "exact",
          head: true,
        });

    if (generationsError) throw generationsError;

    const { count: payments, error: paymentsError } =
      await supabase
        .from("payments")
        .select("id", {
          count: "exact",
          head: true,
        });

    if (paymentsError) throw paymentsError;

    res.json({
      users: users || 0,
      generations: generations || 0,
      payments: payments || 0,
    });
  } catch (error) {
    console.error("Admin dashboard error:", error);

    res.status(500).json({
      message: "Failed to load dashboard",
    });
  }
}

export async function users(req, res) {
  try {
    const { data, error } = await supabase
      .from("users")
      .select(
        "id,name,email,role,plan,credits,created_at,updated_at"
      )
      .order("created_at", {
        ascending: false,
      });

    if (error) throw error;

    res.json({
      users: data || [],
    });
  } catch (error) {
    console.error("Admin users error:", error);

    res.status(500).json({
      message: "Failed to load users",
    });
  }
}

export async function revenue(req, res) {
  try {
    const { data, error } = await supabase
      .from("payments")
      .select("amount,status");

    if (error) throw error;

    const successfulPayments = (data || []).filter(
      (payment) =>
        payment.status === "success" ||
        payment.status === "paid"
    );

    const totalRevenue = successfulPayments.reduce(
      (total, payment) =>
        total + Number(payment.amount || 0),
      0
    );

    res.json({
      revenue: totalRevenue,
      payments: successfulPayments.length,
    });
  } catch (error) {
    console.error("Admin revenue error:", error);

    res.status(500).json({
      message: "Failed to load revenue",
    });
  }
}

export async function usage(req, res) {
  try {
    const { data, error } = await supabase
      .from("generations")
      .select("id,provider,status,created_at");

    if (error) throw error;

    const generations = data || [];

    const providerUsage = {};

    for (const generation of generations) {
      const provider = generation.provider || "demo";

      providerUsage[provider] =
        (providerUsage[provider] || 0) + 1;
    }

    res.json({
      generations: generations.length,
      providerUsage,
    });
  } catch (error) {
    console.error("Admin usage error:", error);

    res.status(500).json({
      message: "Failed to load usage",
    });
  }
}