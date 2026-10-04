import { supabase } from "../config/db.js";
import { chargeCredits } from "../services/credits.js";
import { getAIProvider } from "../services/aiProvider.js";

const getCost = (type) => {
  if (type === "image") return 10;
  if (type === "pdf") return 5;
  return 1;
};

async function saveGeneration({
  userId,
  toolId = null,
  title,
  content,
  status = "completed",
  amount = 0,
  plan = "free",
  provider = "demo",
  transactionId = null,
  question = null,
  answer = null,
  slug = null,
}) {
  const { data, error } = await supabase
    .from("generations")
    .insert({
      user_id: userId,
      tool_id: toolId,
      title,
      content:
        typeof content === "string"
          ? content
          : JSON.stringify(content),
      status,
      amount,
      plan,
      provider,
      transaction_id: transactionId,
      question,
      answer:
        typeof answer === "string"
          ? answer
          : JSON.stringify(answer),
      slug,
    })
    .select("*")
    .single();

  if (error) throw error;

  return data;
}

async function finishGeneration({
  req,
  res,
  result,
  cost,
  title,
  slug,
  toolId,
  prompt,
  provider,
}) {
  const generation = await saveGeneration({
    userId: req.user.id,
    toolId,
    title,
    content: result,
    amount: cost,
    plan: req.user.plan || "free",
    provider: provider.name || "gemini",
    question: prompt,
    answer: result,
    slug,
  });

  const remainingCredits = await getRemainingCredits(req.user.id);

  return res.json({
    success: true,
    result,
    credits: remainingCredits,
    generationId: generation.id,
    generation,
  });
}

async function getRemainingCredits(userId) {
  const { data, error } = await supabase
    .from("users")
    .select("credits")
    .eq("id", userId)
    .single();

  if (error) throw error;

  return Number(data?.credits || 0);
}

export async function generate(req, res) {
  try {
    const {
      prompt,
      type = "text",
      toolId = null,
      slug = null,
      title = "AI Generation",
    } = req.body;

    if (!prompt) {
      return res.status(400).json({ message: "Prompt is required" });
    }

    const cost = getCost(type);
    await chargeCredits(req.user.id, cost);

    const provider = getAIProvider();

    const result = await provider.generate({
      prompt,
      type,
      user: req.user,
    });

    return finishGeneration({
      req,
      res,
      result,
      cost,
      title,
      slug,
      toolId,
      prompt,
      provider,
    });
  } catch (error) {
    console.error("AI generate error:", error);
    return res.status(error.status || 500).json({
      message: error.message || "AI generation failed",
    });
  }
}

export async function image(req, res) {
  try {
    const {
      prompt,
      toolId = null,
      slug = "ai-image-generator",
      title = "AI Image Generation",
    } = req.body;

    if (!prompt) {
      return res.status(400).json({
        message: "Image prompt is required",
      });
    }

    const cost = 10;
    await chargeCredits(req.user.id, cost);

    const provider = getAIProvider();

    const result = await provider.image({
      prompt,
      user: req.user,
    });

    return finishGeneration({
      req,
      res,
      result,
      cost,
      title,
      slug,
      toolId,
      prompt,
      provider,
    });
  } catch (error) {
    console.error("AI image error:", error);
    return res.status(error.status || 500).json({
      message: error.message || "Image generation failed",
    });
  }
}

export async function summarize(req, res) {
  try {
    const {
      text,
      toolId = null,
      slug = "ai-summarizer",
      title = "AI Summary",
    } = req.body;

    if (!text) {
      return res.status(400).json({ message: "Text is required" });
    }

    const cost = 1;
    await chargeCredits(req.user.id, cost);

    const provider = getAIProvider();

    const result = await provider.summarize({
      text,
      user: req.user,
    });

    return finishGeneration({
      req,
      res,
      result,
      cost,
      title,
      slug,
      toolId,
      prompt: text,
      provider,
    });
  } catch (error) {
    console.error("AI summarize error:", error);
    return res.status(error.status || 500).json({
      message: error.message || "Summarization failed",
    });
  }
}

export async function translate(req, res) {
  try {
    const {
      text,
      language,
      toolId = null,
      slug = "ai-translator",
      title = "AI Translation",
    } = req.body;

    if (!text || !language) {
      return res.status(400).json({
        message: "Text and target language are required",
      });
    }

    const cost = 1;
    await chargeCredits(req.user.id, cost);

    const provider = getAIProvider();

    const result = await provider.translate({
      text,
      language,
      user: req.user,
    });

    return finishGeneration({
      req,
      res,
      result,
      cost,
      title,
      slug,
      toolId,
      prompt: text,
      provider,
    });
  } catch (error) {
    console.error("AI translate error:", error);
    return res.status(error.status || 500).json({
      message: error.message || "Translation failed",
    });
  }
}
