const OPENROUTER_URL =
  "https://openrouter.ai/api/v1/chat/completions";

/*
 * Free Qwen model.
 * Designed for clean final answers without visible thinking traces.
 */
const FREE_MODEL =
  "qwen/qwen3-next-80b-a3b-instruct:free";

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/*
 * Clean unwanted reasoning / thinking text
 */
function cleanResult(value) {
  if (typeof value !== "string") {
    return "";
  }

  let result = value.trim();

  /*
   * Remove <think>...</think> blocks if any model/provider
   * accidentally returns them.
   */
  result = result.replace(
    /<think>[\s\S]*?<\/think>/gi,
    ""
  );

  /*
   * Remove standalone reasoning tags.
   */
  result = result.replace(
    /<thinking>[\s\S]*?<\/thinking>/gi,
    ""
  );

  /*
   * Remove common final-answer wrapper tags.
   */
  result = result.replace(
    /<\/?final>/gi,
    ""
  );

  return result.trim();
}

/*
 * Extract AI response safely from OpenRouter response.
 */
function extractResult(data) {
  const message = data?.choices?.[0]?.message;

  if (!message) {
    return "";
  }

  let result = message.content;

  /*
   * Some providers can return content as an array.
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
      .join("");
  }

  return cleanResult(result);
}

/*
 * Call OpenRouter
 */
async function callOpenRouter(prompt) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error(
      "OPENROUTER_API_KEY is not configured."
    );
  }

  const maxRetries = 2;

  for (
    let attempt = 0;
    attempt <= maxRetries;
    attempt++
  ) {
    try {
      const response = await fetch(
        OPENROUTER_URL,
        {
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
                content: `
You are AIForge's professional AI assistant.

IMPORTANT OUTPUT RULES:
- Return ONLY the final answer.
- Never reveal your reasoning.
- Never reveal your analysis.
- Never output a thinking process.
- Never output <think> or <thinking> blocks.
- Never explain how you generated the answer unless explicitly asked.
- Follow the user's requested format exactly.
- Keep answers clear, useful and professional.
                `.trim(),
              },

              {
                role: "user",
                content: prompt,
              },
            ],

            temperature: 0.4,

            max_tokens: 1000,
          }),
        }
      );

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

        /*
         * Retry rate-limit and server errors.
         */
        if (
          (
            response.status === 429 ||
            response.status >= 500
          ) &&
          attempt < maxRetries
        ) {
          await sleep(
            1500 * (attempt + 1)
          );

          continue;
        }

        throw new Error(message);
      }

      /*
       * Extract response.
       */
      const result = extractResult(data);

      /*
       * Make sure response is not empty.
       */
      if (result.length > 0) {
        return result;
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
        `OpenRouter attempt ${
          attempt + 1
        } failed:`,
        error?.message || error
      );

      /*
       * Retry failed request.
       */
      if (attempt >= maxRetries) {
        throw error;
      }

      await sleep(
        1500 * (attempt + 1)
      );
    }
  }

  throw new Error(
    "OpenRouter request failed."
  );
}


/*
 * AI Provider
 */
class OpenRouterProvider {
  constructor() {
    this.name = "openrouter-free";

    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error(
        "OPENROUTER_API_KEY is missing."
      );
    }
  }

  /*
   * Generic AI request
   */
  async run(prompt) {
    return callOpenRouter(prompt);
  }


  /*
   * AI Writer
   */
  async generate({ prompt, type }) {
    return this.run(`
You are an AI writing assistant inside AIForge.

Task type:
${type || "text"}

User request:
${prompt}

STRICT OUTPUT RULES:
- Return ONLY the final answer.
- Do NOT show reasoning.
- Do NOT show analysis.
- Do NOT show your thinking process.
- Do NOT explain what you are doing.
- Do NOT write "Here is my thinking".
- Do NOT write "Thinking process".
- Do NOT use <think> tags.
- Do NOT add unnecessary commentary.

Give the best useful and professional final answer.
    `.trim());
  }


  /*
   * AI Summarizer
   */
  async summarize({ text }) {
    return this.run(`
You are a professional AI summarization tool inside AIForge.

Summarize the following text.

STRICT OUTPUT RULES:
- Return ONLY the final summary.
- Do NOT show reasoning.
- Do NOT show analysis.
- Do NOT explain your process.
- Do NOT add "Here is the summary".
- Do NOT use <think> tags.
- Keep the summary concise.
- Keep only the important information.
- Preserve the original meaning.

Text:
${text}
    `.trim());
  }


  /*
   * AI Translator
   */
  async translate({ text, language }) {
    return this.run(`
You are a professional translation engine inside AIForge.

Translate the following text into:

TARGET LANGUAGE:
${language}

STRICT OUTPUT RULES:
- Return ONLY the translated text.
- Do NOT explain anything.
- Do NOT show reasoning.
- Do NOT show analysis.
- Do NOT describe the translation.
- Do NOT add notes.
- Do NOT add quotation marks unless they are part of the original text.
- Do NOT write "Here is the translation".
- Do NOT write "Translation:".
- Do NOT use <think> tags.
- Preserve the original meaning.
- Use natural and grammatically correct ${language}.

TEXT TO TRANSLATE:
${text}
    `.trim());
  }


  /*
   * Image generation is currently unavailable
   * with this free text-only provider.
   */
  async image() {
    throw new Error(
      "Image generation is not available through the current free text AI provider."
    );
  }
}


/*
 * Export provider
 */
export function getAIProvider() {
  return new OpenRouterProvider();
}