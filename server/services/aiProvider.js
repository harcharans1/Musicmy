const OPENROUTER_URL =
  "https://openrouter.ai/api/v1/chat/completions";

const FREE_MODEL = "openai/gpt-oss-20b:free";

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

async function callOpenRouter(prompt) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY is not configured."
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
                "You are an AI assistant inside AIForge. Give clear, useful and professional answers.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],

          temperature: 0.7,

          max_tokens: 2000,

          reasoning: {
            effort: "low",
            exclude: true,
          },
        }),
      });

      const data = await response.json();

      console.log(
        "OpenRouter status:",
        response.status
      );

      if (!response.ok) {
        console.error(
          "OpenRouter API error:",
          JSON.stringify(data)
        );

        const message =
          data?.error?.message ||
          `OpenRouter request failed with status ${response.status}`;

        if (
          (response.status === 429 ||
            response.status >= 500) &&
          attempt < maxRetries
        ) {
          await sleep(1500 * (attempt + 1));
          continue;
        }

        throw new Error(message);
      }

      const message = data?.choices?.[0]?.message;

      /*
       * Normal answer
       */
      let result = message?.content;

      /*
       * Some models may return content as an array.
       */
      if (Array.isArray(result)) {
        result = result
          .map((item) => {
            if (typeof item === "string") {
              return item;
            }

            return (
              item?.text ||
              item?.content ||
              ""
            );
          })
          .join("")
          .trim();
      }

      /*
       * Make sure we never silently accept an empty response.
       */
      if (
        typeof result === "string" &&
        result.trim().length > 0
      ) {
        return result.trim();
      }

      console.error(
        "OpenRouter returned unexpected response:",
        JSON.stringify(data)
      );

      throw new Error(
        "OpenRouter returned an empty AI response."
      );
    } catch (error) {
      console.error(
        `OpenRouter attempt ${attempt + 1} failed:`,
        error?.message || error
      );

      if (attempt >= maxRetries) {
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

Give a useful, clear and professional response.
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

  async image() {
    throw new Error(
      "Image generation is not available through the current free text AI provider."
    );
  }
}

export function getAIProvider() {
  return new OpenRouterProvider();
}