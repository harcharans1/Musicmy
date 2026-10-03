import { supabase } from "../config/db.js";

export async function chargeCredits(userId, cost) {
  if (!userId) {
    const error = new Error("User ID is required");
    error.status = 400;
    throw error;
  }

  if (!cost || cost <= 0) {
    return null;
  }

  const { data: user, error: findError } = await supabase
    .from("users")
    .select("id,credits")
    .eq("id", userId)
    .maybeSingle();

  if (findError) {
    throw findError;
  }

  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  if (user.credits < cost) {
    const error = new Error("Insufficient credits");
    error.status = 402;
    throw error;
  }

  const newCredits = user.credits - cost;

  const { data: updatedUser, error: updateError } = await supabase
    .from("users")
    .update({
      credits: newCredits,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .select("id,credits")
    .single();

  if (updateError) {
    throw updateError;
  }

  return updatedUser.credits;
}