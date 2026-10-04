import { supabase } from "../config/db.js";
import { chargeCredits } from "../services/credits.js";
import { getAIProvider } from "../services/aiProvider.js";

/*
|--------------------------------------------------------------------------
| Credit Costs
|--------------------------------------------------------------------------
*/

const TOOL_COSTS = {
  "ai-writer": 1,
  "ai-paraphraser": 1,
  "ai-summarizer": 1,
  "ai-translator": 1,
  "ai-image-generator": 10,
  "ai-image-enhancer": 5,
  "code-generator": 2,
  "code-explainer": 2,
  "pdf-summarizer": 5,
  "caption-generator": 1,
  "resume-builder": 4,
  "email-writer": 1,
};

const getCost = (type = "text", slug = null) => {
  /*
   * First priority:
   * Tool slug based cost.
   */
  if (slug && TOOL_COSTS[slug] !== undefined) {
    return TOOL_COSTS[slug];
  }

  /*
   * Fallback:
   * Type based cost.
   */
  if (type === "image") return 10;
  if (type === "pdf") return 5;

  return 1;
};

/*
|--------------------------------------------------------------------------
| Get Remaining Credits
|--------------------------------------------------------------------------
*/

async function getRemainingCredits(userId) {
  const { data, error } = await supabase
    .from("users")
    .select("credits")
    .eq("id", userId)
    .single();

  if (error) {
    throw error;
  }

  return Number(data?.credits || 0);
}

/*
|--------------------------------------------------------------------------
| Save Generation
|--------------------------------------------------------------------------
*/

async function saveGeneration({
  userId,
  toolId = null,
  title = "AI Generation",
  content,
  status = "completed",
  amount = 0,
  plan = "free",
  provider = "openai",
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

  if (error) {
    throw error;
  }

  return data;
}

/*
|--------------------------------------------------------------------------
| Finish Generation
|--------------------------------------------------------------------------
|
| AI response successful hon ton baad:
| 1. Credits charge
| 2. Generation save
| 3. Remaining credits return
|
*/

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
  /*
   * Charge credits only after successful AI response.
   */
  await chargeCredits(req.user.id, cost);

  /*
   * Save generation in Supabase.
   */
  const generation = await saveGeneration({
    userId: req.user.id,
    toolId,
    title,
    content: result,
    amount: cost,
    plan: req.user.plan || "free",
    provider: provider?.name || "openai",
    question: prompt,
    answer: result,
    slug,
  });

  /*
   * Get updated credits.
   */
  const remainingCredits = await getRemainingCredits(
    req.user.id
  );

  /*
   * Send response.
   */
  return res.json({
    success: true,
    result,
    credits: remainingCredits,
    generationId: generation.id,
    generation,
  });
}

/*
|--------------------------------------------------------------------------
| AI GENERATE
|--------------------------------------------------------------------------
*/

export async function generate(req, res) {
  try {
    const {
      prompt,
      type = "text",
      toolId = null,
      slug = null,
      title = "AI Generation",
    } = req.body;

    /*
     * Validate prompt.
     */
    if (!prompt || !String(prompt).trim()) {
      return res.status(400).json({
        success: false,
        message: "Prompt is required",
      });
    }

    const cleanPrompt = String(prompt).trim();

    /*
     * Get tool-specific credit cost.
     */
    const cost = getCost(type, slug);

    /*
     * Get AI provider.
     */
    const provider = getAIProvider();

    /*
     * IMPORTANT:
     *
     * slug is passed to the AI provider.
     * This allows different AI tools to use
     * their own instructions.
     */
    const result = await provider.generate({
      prompt: cleanPrompt,
      type,
      slug,
      user: req.user,
    });

    /*
     * Finish generation.
     */
    return finishGeneration({
      req,
      res,
      result,
      cost,
      title,
      slug,
      toolId,
      prompt: cleanPrompt,
      provider,
    });
  } catch (error) {
    console.error("AI generate error:", error);

    return res.status(error.status || 500).json({
      success: false,
      message:
        error.message ||
        "AI generation failed. Please try again.",
    });
  }
}

/*
|--------------------------------------------------------------------------
| AI IMAGE
|--------------------------------------------------------------------------
*/

export async function image(req, res) {
  try {
    const {
      prompt,
      toolId = null,
      slug = "ai-image-generator",
      title = "AI Image Generation",
    } = req.body;

    /*
     * Validate prompt.
     */
    if (!prompt || !String(prompt).trim()) {
      return res.status(400).json({
        success: false,
        message: "Image prompt is required",
      });
    }

    const cleanPrompt = String(prompt).trim();

    /*
     * Get image tool-specific cost.
     */
    const cost = getCost("image", slug);

    const provider = getAIProvider();

    /*
     * Current provider may not support image generation.
     *
     * If unavailable, provider throws an error here.
     * Credits are NOT charged.
     */
    const result = await provider.image({
      prompt: cleanPrompt,
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
      prompt: cleanPrompt,
      provider,
    });
  } catch (error) {
    console.error("AI image error:", error);

    return res.status(error.status || 500).json({
      success: false,
      message:
        error.message ||
        "Image generation failed.",
    });
  }
}

/*
|--------------------------------------------------------------------------
| AI SUMMARIZER
|--------------------------------------------------------------------------
*/

export async function summarize(req, res) {
  try {
    const {
      text,
      toolId = null,
      slug = "ai-summarizer",
      title = "AI Summary",
    } = req.body;

    /*
     * Validate text.
     */
    if (!text || !String(text).trim()) {
      return res.status(400).json({
        success: false,
        message: "Text is required",
      });
    }

    const cleanText = String(text).trim();

    /*
     * Get tool-specific cost.
     */
    const cost = getCost("text", slug);

    const provider = getAIProvider();

    /*
     * Generate summary first.
     */
    const result = await provider.summarize({
      text: cleanText,
      user: req.user,
    });

    /*
     * Charge + save + return.
     */
    return finishGeneration({
      req,
      res,
      result,
      cost,
      title,
      slug,
      toolId,
      prompt: cleanText,
      provider,
    });
  } catch (error) {
    console.error("AI summarize error:", error);

    return res.status(error.status || 500).json({
      success: false,
      message:
        error.message ||
        "Summarization failed.",
    });
  }
}

/*
|--------------------------------------------------------------------------
| AI TRANSLATOR
|--------------------------------------------------------------------------
*/

export async function translate(req, res) {
  try {
    const {
      text,
      language,
      toolId = null,
      slug = "ai-translator",
      title = "AI Translation",
    } = req.body;

    /*
     * Validate text.
     */
    if (!text || !String(text).trim()) {
      return res.status(400).json({
        success: false,
        message: "Text is required",
      });
    }

    /*
     * Validate target language.
     */
    if (!language || !String(language).trim()) {
      return res.status(400).json({
        success: false,
        message: "Target language is required",
      });
    }

    const cleanText = String(text).trim();
    const cleanLanguage = String(language).trim();

    /*
     * Get tool-specific cost.
     */
    const cost = getCost("text", slug);

    const provider = getAIProvider();

    /*
     * Generate translation first.
     */
    const result = await provider.translate({
      text: cleanText,
      language: cleanLanguage,
      user: req.user,
    });

    /*
     * Charge + save + return.
     */
    return finishGeneration({
      req,
      res,
      result,
      cost,
      title,
      slug,
      toolId,
      prompt: cleanText,
      provider,
    });
  } catch (error) {
    console.error("AI translate error:", error);

    return res.status(error.status || 500).json({
      success: false,
      message:
        error.message ||
        "Translation failed.",
    });
  }
}