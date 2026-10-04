const OPENROUTER_URL =
  "https://openrouter.ai/api/v1/chat/completions";

const FREE_MODEL =
  "nvidia/nemotron-3.5-lightning:free";

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/*
 * Remove visible reasoning / thinking from AI response.
 */
function cleanResult(value) {
  if (typeof value !== "string") {
    return "";
  }

  let result = value.trim();

  // Remove <think>...</think>
  result = result.replace(
    /<think>[\s\S]*?<\/think>/gi,
    ""
  );

  // Remove <thinking>...</thinking>
  result = result.replace(
    /<thinking>[\s\S]*?<\/thinking>/gi,
    ""
  );

  // Remove <analysis>...</analysis>
  result = result.replace(
    /<analysis>[\s\S]*?<\/analysis>/gi,
    ""
  );

  // Remove common final tags
  result = result.replace(
    /<\/?final>/gi,
    ""
  );

  return result.trim();
}

/*
 * Extract response from OpenRouter.
 */
function extractResult(data) {
  const message =
    data?.choices?.[0]?.message;

  if (!message) {
    return "";
  }

  let result = message.content;

  /*
   * Some models can return content as array.
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
 * OpenRouter request
 */
async function callOpenRouter(prompt) {
  const apiKey =
    process.env.OPENROUTER_API_KEY;

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
You are AIForge AI assistant.

IMPORTANT:
Return ONLY the final answer.

Never show:
- reasoning
- analysis
- thinking process
- internal thoughts
- planning
- <think> tags
- <thinking> tags
- <analysis> tags

Never say:
"Here is my thinking"
"Thinking process"
"Let's analyze"
"Reasoning"

Give only the useful final response.
                `.trim(),
              },

              {
                role: "user",
                content: prompt,
              },
            ],

            temperature: 0.3,

            max_tokens: 1000,

            /*
             * Ask OpenRouter to exclude reasoning
             * when supported by the model/provider.
             */
            reasoning: {
              effort: "low",
              exclude: true,
            },
          }),
        }
      );

      const data =
        await response.json();

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
         * Retry rate-limit/server errors.
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

      const result =
        extractResult(data);

      if (result.length > 0) {
        return result;
      }

      console.error(
        "OpenRouter returned empty response:",
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
    this.name =
      "openrouter-free";

    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error(
        "OPENROUTER_API_KEY is missing."
      );
    }
  }


  async run(prompt) {
    return callOpenRouter(prompt);
  }


  /*
   * AI Writer
   */
  async generate({
    prompt,
    type,
  }) {
    return this.run(`
Task type:
${type || "text"}

User request:
${prompt}

STRICT RULES:
Return ONLY the final answer.

Do not show:
- reasoning
- analysis
- thinking
- planning
- internal thoughts

Do not explain how you generated the answer.

Give a clear, useful and professional final response.
    `.trim());
  }


  /*
   * AI Summarizer
   */
  async summarize({
    text,
  }) {
    return this.run(`
You are a professional summarization engine.

Summarize the following text.

STRICT RULES:
- Return ONLY the final summary.
- Do NOT show reasoning.
- Do NOT show analysis.
- Do NOT show thinking.
- Do NOT explain the process.
- Do NOT add unnecessary commentary.
- Keep the important information.
- Keep it concise.
- Preserve the original meaning.

Text:
${text}
    `.trim());
  }


  /*
   * AI Translator
   */
  async translate({
    text,
    language,
  }) {
    return this.run(`
You are a professional translation engine.

Translate the text below into:

TARGET LANGUAGE:
${language}

STRICT RULES:
- Return ONLY the translated text.
- Do NOT explain anything.
- Do NOT show reasoning.
- Do NOT show analysis.
- Do NOT show thinking.
- Do NOT describe the translation.
- Do NOT write "Translation:".
- Do NOT write "Here is the translation".
- Do NOT add notes.
- Do NOT add commentary.
- Do NOT use markdown.
- Preserve the original meaning.
- Use natural and grammatically correct ${language}.

TEXT:
${text}
    `.trim());
  }


  /*
   * Image generation
   *
   * Current free provider is text-only.
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