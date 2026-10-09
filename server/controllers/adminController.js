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

export async function updateUser(req,res){
  try{
    const { id } = req.params;
    const { role, plan, credits } = req.body || {};
    const updates = { updated_at: new Date().toISOString() };
    if (role !== undefined) {
      if (!['user','admin'].includes(String(role))) return res.status(400).json({message:'Invalid role.'});
      updates.role = String(role);
    }
    if (plan !== undefined) {
      if (!['free','pro','premium'].includes(String(plan))) return res.status(400).json({message:'Invalid plan.'});
      updates.plan = String(plan);
      if (updates.plan === 'free') { updates.subscription_started_at = null; updates.subscription_expires_at = null; }
      if (updates.plan !== 'free' && !updates.subscription_expires_at) updates.subscription_expires_at = new Date(Date.now()+30*24*60*60*1000).toISOString();
    }
    if (credits !== undefined) {
      const value = Number(credits);
      if (!Number.isInteger(value) || value < 0 || value > 1000000) return res.status(400).json({message:'Credits must be a valid non-negative integer.'});
      updates.credits = value;
    }
    const {data,error}=await supabase.from('users').update(updates).eq('id',id).select('id,name,email,role,plan,credits,subscription_started_at,subscription_expires_at,created_at,updated_at').single();
    if(error) return res.status(404).json({message:'User not found or could not be updated.'});
    res.json({success:true,user:data});
  }catch(error){ console.error('Admin update user error:',error); res.status(500).json({message:'Failed to update user'}); }
}
