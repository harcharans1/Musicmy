import { supabase } from "../config/db.js";

export async function chargeCredits(userId, cost) {
  if (!userId) {
    const error =
      new Error("User ID is required");

    error.status = 400;
    throw error;
  }

  if (!cost || cost <= 0) {
    return null;
  }

  const { data, error } =
    await supabase.rpc(
      "consume_user_credits",
      {
        p_user_id: userId,
        p_cost: Number(cost),
      }
    );

  if (error) {
    const message =
      String(error.message || "");

    if (
      message.includes(
        "INSUFFICIENT_CREDITS"
      )
    ) {
      const e =
        new Error("Insufficient credits");

      e.status = 402;
      throw e;
    }

    if (
      message.includes(
        "USER_NOT_FOUND"
      )
    ) {
      const e =
        new Error("User not found");

      e.status = 404;
      throw e;
    }

    throw error;
  }

  return Number(data);
}