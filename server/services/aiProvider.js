const OPENROUTER_URL =
  "https://openrouter.ai/api/v1/chat/completions";

const FREE_MODEL = "openrouter/free";

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

function isRetryableError(status, message = "") {
  const text = String(message).toLowerCase();

  return (
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504 ||
    text.includes("rate limit") ||
    text.includes("temporarily unavailable") ||
    text.includes("overloaded") ||
    text.includes("timeout")
  );
}

async function callOpenRouter(prompt) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY is not configured on the server."
    );
  }

  const maxRetries = 2;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(OPENROUTER_URL, {
        method: "POST",

        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",

          "HTTP-Referer":
            process.env.CLIENT_URL ||
            "https://musicmyy.netlify.app",

          "X-Title": "AIForge",
        },

        body: JSON.stringify({
          model: FREE_MODEL,

          messages: [
            {
              role: "system",
              content:
                "You are an AI assistant inside AIForge. Give clear, useful, accurate and professional answers.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],

          temperature: 0.7,

          max_tokens: 2000,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage =
          data?.error?.message ||
          `OpenRouter request failed with status ${response.status}`;

        console.error(
          `OpenRouter attempt ${attempt + 1} failed:`,
          errorMessage
        );

        if (
          !isRetryableError(
            response.status,
            errorMessage
          ) ||
          attempt === maxRetries
        ) {
          throw new Error(errorMessage);
        }

        await sleep(1500 * (attempt + 1));
        continue;
      }

      const result =
        data?.choices?.[0]?.message?.content;

      if (!result) {
        throw new Error(
          "OpenRouter returned an empty response."
        );
      }

      return result;
    } catch (error) {
      console.error(
        `OpenRouter attempt ${attempt + 1} error:`,
        error?.message || error
      );

      if (
        !isRetryableError(
          error?.status,
          error?.message
        ) ||
        attempt === maxRetries
      ) {
        throw error;
      }

      await sleep(1500 * (attempt + 1));
    }
  }

  throw new Error("OpenRouter request failed.");
}

class OpenRouterProvider {
  constructor() {
    this.name = "openrouter-free";

    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error(
        "OPENROUTER_API_KEY is missing."
      );
    }
  }

  async run(prompt) {
    return callOpenRouter(prompt);
  }

  async generate({ prompt, type }) {
    return this.run(`
Task type: ${type || "text"}

User request:
${prompt}

Provide a high-quality professional response.
`);
  }

  async summarize({ text }) {
    return this.run(`
Summarize the following text clearly and professionally.

Requirements:
- Keep the important information.
- Remove unnecessary repetition.
- Use simple and readable language.
- Preserve the original meaning.

Text:
${text}
`);
  }

  async translate({ text, language }) {
    return this.run(`
Translate the following text into ${language || "English"}.

Requirements:
- Preserve the original meaning.
- Keep the tone natural.
- Do not add unnecessary information.

Text:
${text}
`);
  }

  async image() {
    throw new Error(
      "Image generation is not available through the free OpenRouter text router."
    );
  }
}

export function getAIProvider() {
  return new OpenRouterProvider();
}