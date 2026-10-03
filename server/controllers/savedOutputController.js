import { supabase } from "../config/db.js";

export async function saveOutput(req, res) {
  try {
    const { title, content } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({
        message: "Output content is required",
      });
    }

    const { data, error } = await supabase
      .from("saved_outputs")
      .insert({
        user_id: req.user.id,
        title: title || "AI Output",
        content,
      })
      .select("*")
      .single();

    if (error) {
      console.error("Save output database error:", error);
      throw error;
    }

    res.status(201).json({
      success: true,
      message: "Output saved successfully",
      savedOutput: data,
    });
  } catch (error) {
    console.error("Save output error:", error);

    res.status(500).json({
      message: "Failed to save output",
    });
  }
}

export async function getSavedOutputs(req, res) {
  try {
    const { data, error } = await supabase
      .from("saved_outputs")
      .select("*")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({
      savedOutputs: data || [],
    });
  } catch (error) {
    console.error("Get saved outputs error:", error);

    res.status(500).json({
      message: "Failed to load saved outputs",
    });
  }
}

export async function deleteSavedOutput(req, res) {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("saved_outputs")
      .delete()
      .eq("id", id)
      .eq("user_id", req.user.id);

    if (error) throw error;

    res.json({
      success: true,
      message: "Saved output deleted",
    });
  } catch (error) {
    console.error("Delete saved output error:", error);

    res.status(500).json({
      message: "Failed to delete saved output",
    });
  }
}