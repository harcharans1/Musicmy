import { supabase } from "../config/db.js";

const demo = [
  ["AI Writer", "ai-writer", "Create blogs, emails and marketing copy.", "Writing", 1],
  ["AI Paraphraser", "ai-paraphraser", "Rewrite text with a fresh voice.", "Writing", 1],
  ["AI Summarizer", "ai-summarizer", "Turn long content into summaries.", "Productivity", 1],
  ["AI Translator", "ai-translator", "Translate across languages.", "Writing", 1],
  ["AI Image Generator", "ai-image-generator", "Generate visuals from prompts.", "Image", 10],
  ["AI Image Enhancer", "ai-image-enhancer", "Improve image clarity.", "Image", 5],
  ["Code Generator", "code-generator", "Generate code from language.", "Coding", 2],
  ["Code Explainer", "code-explainer", "Explain unfamiliar code.", "Coding", 2],
  ["PDF Summarizer", "pdf-summarizer", "Extract insight from PDFs.", "PDF", 5],
  ["Caption Generator", "caption-generator", "Create social captions.", "Social Media", 1],
  ["Resume Builder", "resume-builder", "Build a professional resume.", "Education", 4],
  ["Email Writer", "email-writer", "Write professional emails.", "Business", 1],
];

function formatTool(tool) {
  if (!tool) return null;

  return {
    id: tool.id,
    name: tool.name,
    slug: tool.slug,
    description: tool.description,
    category: tool.category,
    icon: tool.icon,
    provider: tool.provider,
    creditCost: tool.credit_cost,
    isPremium: tool.is_premium,
    isActive: tool.is_active,
  };
}

function demoTool(item) {
  return {
    name: item[0],
    slug: item[1],
    description: item[2],
    category: item[3],
    creditCost: item[4],
  };
}

export async function listTools(req, res) {
  try {
    const { data, error } = await supabase
      .from("tools")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (error) throw error;

    let tools = (data || []).map(formatTool);

    if (!tools.length) {
      tools = demo.map(demoTool);
    }

    const q = (req.query.q || "").toLowerCase().trim();

    if (q) {
      tools = tools.filter((tool) =>
        tool.name.toLowerCase().includes(q)
      );
    }

    res.json({ tools });
  } catch (error) {
    console.error("List tools error:", error);

    res.status(500).json({
      message: "Failed to load tools",
    });
  }
}

export async function getTool(req, res) {
  try {
    const { data, error } = await supabase
      .from("tools")
      .select("*")
      .eq("slug", req.params.slug)
      .maybeSingle();

    if (error) throw error;

    if (data) {
      return res.json({
        tool: formatTool(data),
      });
    }

    const item = demo.find(
      (d) => d[1] === req.params.slug
    );

    if (!item) {
      return res.status(404).json({
        message: "Tool not found",
      });
    }

    res.json({
      tool: demoTool(item),
    });
  } catch (error) {
    console.error("Get tool error:", error);

    res.status(500).json({
      message: "Failed to load tool",
    });
  }
}

export async function createTool(req, res) {
  try {
    const {
      name,
      slug,
      description,
      category,
      icon,
      provider,
      creditCost,
      isPremium,
      isActive,
    } = req.body;

    const { data, error } = await supabase
      .from("tools")
      .insert({
        name,
        slug,
        description,
        category,
        icon,
        provider,
        credit_cost: creditCost ?? 1,
        is_premium: isPremium ?? false,
        is_active: isActive ?? true,
      })
      .select("*")
      .single();

    if (error) throw error;

    res.status(201).json({
      tool: formatTool(data),
    });
  } catch (error) {
    console.error("Create tool error:", error);

    res.status(500).json({
      message: "Failed to create tool",
    });
  }
}

export async function updateTool(req, res) {
  try {
    const {
      name,
      slug,
      description,
      category,
      icon,
      provider,
      creditCost,
      isPremium,
      isActive,
    } = req.body;

    const updates = {};

    if (name !== undefined) updates.name = name;
    if (slug !== undefined) updates.slug = slug;
    if (description !== undefined) updates.description = description;
    if (category !== undefined) updates.category = category;
    if (icon !== undefined) updates.icon = icon;
    if (provider !== undefined) updates.provider = provider;
    if (creditCost !== undefined) updates.credit_cost = creditCost;
    if (isPremium !== undefined) updates.is_premium = isPremium;
    if (isActive !== undefined) updates.is_active = isActive;

    const { data, error } = await supabase
      .from("tools")
      .update(updates)
      .eq("id", req.params.id)
      .select("*")
      .single();

    if (error) throw error;

    res.json({
      tool: formatTool(data),
    });
  } catch (error) {
    console.error("Update tool error:", error);

    res.status(500).json({
      message: "Failed to update tool",
    });
  }
}

export async function deleteTool(req, res) {
  try {
    const { error } = await supabase
      .from("tools")
      .delete()
      .eq("id", req.params.id);

    if (error) throw error;

    res.json({
      success: true,
    });
  } catch (error) {
    console.error("Delete tool error:", error);

    res.status(500).json({
      message: "Failed to delete tool",
    });
  }
}