import { GoogleGenAI } from "@google/genai";

const MODEL_PRIMARY = "gemini-3.8-flash";
const MODEL_FALLBACK = "gemini-3.7-flash";
const IMAGE_MODEL = "gemini-3.1-flash-image";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function isRetryableError(error) {
  const message = String(error?.message || error || "").toLowerCase();

  return (
    message.includes("503") ||
    message.includes("unavailable") ||
    message.includes("overloaded") ||
    message.includes("high demand") ||
    message.includes("429") ||
    message.includes("rate limit") ||
    message.includes("timeout")
  );
}

async function generateWithRetry(client, model, contents) {
  const maxRetries = 3;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await client.models.generateContent({
        model,
        contents,
      });

      return response.text;
    } catch (error) {
      console.error(
        `Gemini ${model} attempt ${attempt + 1} failed:`,
        error?.message || error
      );

      if (!isRetryableError(error) || attempt === maxRetries) {
        throw error;
      }

      await sleep(
        Math.min(1000 * 2 ** attempt + Math.random() * 500, 8000)
      );
    }
  }

  throw new Error("Gemini request failed");
}

class GeminiProvider {
  constructor() {
    this.name = "gemini";

    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is missing");
    }

    this.client = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
  }

  async run(contents) {
    try {
      return await generateWithRetry(
        this.client,
        MODEL_PRIMARY,
        contents
      );
    } catch (primaryError) {
      console.error(
        "Primary Gemini model failed:",
        primaryError?.message || primaryError
      );

      try {
        return await generateWithRetry(
          this.client,
          MODEL_FALLBACK,
          contents
        );
      } catch (fallbackError) {
        console.error(
          "Fallback Gemini model failed:",
          fallbackError?.message || fallbackError
        );

        throw new Error(
          "Gemini AI is temporarily unavailable. Please try again in a few moments."
        );
      }
    }
  }

  async generate({ prompt, type }) {
    return this.run(`
You are an AI assistant inside AIForge.

Task type: ${type || "text"}

User request:
${prompt}

Give a clear, useful and professional answer.
`);
  }

  async summarize({ text }) {
    return this.run(`
Summarize the following text clearly and professionally.

Text:
${text}
`);
  }

  async translate({ text, language }) {
    return this.run(`
Translate the following text into ${language}.

Text:
${text}
`);
  }

  async image({ prompt }) {
    const interaction = await this.client.interactions.create({
      model: IMAGE_MODEL,
      input: prompt,
      response_format: {
        type: "image",
        mime_type: "image/png",
        aspect_ratio: "1:1",
        image_size: "1K",
      },
    });

    const image = interaction.output_image;

    if (!image?.data) {
      throw new Error("Gemini did not return an image.");
    }

    return {
      url: `data:${image.mime_type || "image/png"};base64,${image.data}`,
      prompt,
    };
  }
}

export function getAIProvider() {
  return new GeminiProvider();
}
