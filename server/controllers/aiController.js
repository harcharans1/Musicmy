import { supabase } from "../config/db.js";
import { chargeCredits } from "../services/credits.js";
import { getAIProvider } from "../services/aiProvider.js";

const getCost = (type) => {
  if (type === "image") return 10;
  if (type === "pdf") return 5;
  return 1;
};

async function getRemainingCredits(userId) {
  const { data, error } = await supabase
    .from("users")
    .select("credits")
    .eq("id", userId)
    .single();

  if (error) throw error;

  return Number(data?.credits || 0);
}

async function saveGeneration({
  userId,
  toolId = null,
  title,
  content,
  status = "completed",
  amount = 0,
  plan = "free",
  provider = "openrouter-free",
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
   * Provider successfully generated the result.
   * Credits are charged only now.
   */
  await chargeCredits(req.user.id, cost);

  const generation = await saveGeneration({
    userId: req.user.id,
    toolId,
    title,
    content: result,
    amount: cost,
    plan: req.user.plan || "free",
    provider: provider?.name || "openrouter-free",
    question: prompt,
    answer: result,
    slug,
  });

  const remainingCredits = await getRemainingCredits(
    req.user.id
  );

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

    if (!prompt || !String(prompt).trim()) {
      return res.status(400).json({
        message: "Prompt is required",
      });
    }

    const cost = getCost(type);

    const provider = getAIProvider();

    /*
     * IMPORTANT:
     * AI is called BEFORE charging credits.
     * If OpenRouter fails, user keeps their credits.
     */
    const result = await provider.generate({
      prompt: String(prompt).trim(),
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

    if (!prompt || !String(prompt).trim()) {
      return res.status(400).json({
        message: "Image prompt is required",
      });
    }

    const cost = 10;

    const provider = getAIProvider();

    /*
     * Current free OpenRouter provider does not support
     * image generation.
     *
     * Provider will throw an error before credits are charged.
     */
    const result = await provider.image({
      prompt: String(prompt).trim(),
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

    if (!text || !String(text).trim()) {
      return res.status(400).json({
        message: "Text is required",
      });
    }

    const cost = 1;

    const provider = getAIProvider();

    /*
     * Generate first.
     * Charge only after successful AI response.
     */
    const result = await provider.summarize({
      text: String(text).trim(),
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

    if (!text || !language) {
      return res.status(400).json({
        message:
          "Text and target language are required",
      });
    }

    const cost = 1;

    const provider = getAIProvider();

    /*
     * Generate first.
     * Charge only after successful AI response.
     */
    const result = await provider.translate({
      text: String(text).trim(),
      language: String(language).trim(),
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
      success: false,
      message:
        error.message ||
        "Translation failed.",
    });
  }
}