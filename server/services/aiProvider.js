import OpenAI from "openai";

const MODEL = "gpt-5.6-luna";

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/*
 * Clean AI output
 */
function cleanResult(value) {
  if (typeof value !== "string") {
    return "";
  }

  let result = value.trim();

  // Remove accidental reasoning blocks
  result = result.replace(
    /<think>[\s\S]*?<\/think>/gi,
    ""
  );

  result = result.replace(
    /<thinking>[\s\S]*?<\/thinking>/gi,
    ""
  );

  result = result.replace(
    /<analysis>[\s\S]*?<\/analysis>/gi,
    ""
  );

  return result.trim();
}


/*
 * OpenAI request
 */
async function callOpenAI(instructions, input) {
  const maxRetries = 2;

  for (
    let attempt = 0;
    attempt <= maxRetries;
    attempt++
  ) {
    try {
      const response = await client.responses.create({
        model: MODEL,

        instructions,

        input,

        max_output_tokens: 1000,
      });

      const result = cleanResult(
        response.output_text
      );

      if (result) {
        return result;
      }

      throw new Error(
        "OpenAI returned an empty response."
      );
    } catch (error) {
      console.error(
        `OpenAI attempt ${attempt + 1} failed:`,
        error?.message || error
      );

      /*
       * Retry temporary errors
       */
      const status = error?.status;

      if (
        attempt < maxRetries &&
        (
          status === 429 ||
          status >= 500
        )
      ) {
        await sleep(
          1500 * (attempt + 1)
        );

        continue;
      }

      throw error;
    }
  }

  throw new Error(
    "OpenAI request failed."
  );
}


/*
 * AI Provider
 */
class OpenAIProvider {
  constructor() {
    this.name = "openai";

    if (!process.env.OPENAI_API_KEY) {
      throw new Error(
        "OPENAI_API_KEY is missing."
      );
    }
  }


  /*
   * Generic AI request
   */
  async run(
    instructions,
    input
  ) {
    return callOpenAI(
      instructions,
      input
    );
  }


  /*
   * AI Writer
   */
  async generate({
    prompt,
    type,
  }) {
    return this.run(
      `
You are AIForge, a professional AI assistant.

Task type:
${type || "text"}

STRICT RULES:

- Return ONLY the final answer.
- Never show reasoning.
- Never show internal analysis.
- Never show thinking.
- Never describe your thought process.
- Do not add unnecessary commentary.
- Follow the user's request exactly.
- Give a clear, useful and professional answer.
      `.trim(),

      prompt
    );
  }


  /*
   * AI Summarizer
   */
  async summarize({
    text,
  }) {
    return this.run(
      `
You are AIForge's professional summarization engine.

STRICT RULES:

- Return ONLY the final summary.
- Do not explain the process.
- Do not show reasoning.
- Do not show analysis.
- Do not show thinking.
- Do not add unnecessary commentary.
- Keep only important information.
- Preserve the original meaning.
- Keep the summary concise.
      `.trim(),

      `Summarize this text:

${text}`
    );
  }


  /*
   * AI Translator
   */
  async translate({
    text,
    language,
  }) {
    return this.run(
      `
You are AIForge's professional translation engine.

Target language:
${language}

STRICT RULES:

- Return ONLY the translated text.
- Do not explain anything.
- Do not show reasoning.
- Do not show analysis.
- Do not show thinking.
- Do not describe the translation.
- Do not write "Translation:".
- Do not write "Here is the translation".
- Do not add notes.
- Do not add commentary.
- Do not use markdown unless it exists in the original text.
- Preserve the exact meaning.
- Use natural and grammatically correct ${language}.
      `.trim(),

      `Translate this text into ${language}:

${text}`
    );
  }


  /*
   * Image generation
   *
   * Keep disabled for now.
   */
  async image() {
    throw new Error(
      "Image generation is not available through the current AI text provider."
    );
  }
}


/*
 * Export
 */
export function getAIProvider() {
  return new OpenAIProvider();
}