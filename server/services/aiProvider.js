import { GoogleGenAI } from "@google/genai";

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

  async generate({ prompt, type }) {
    const response = await this.client.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `
You are an AI assistant inside AIForge.

Task type: ${type || "text"}

User request:
${prompt}

Give a clear, useful and professional answer.
      `,
    });

    return response.text;
  }

  async summarize({ text }) {
    const response = await this.client.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `
Summarize the following text clearly.

Text:
${text}
      `,
    });

    return response.text;
  }

  async translate({ text, language }) {
    const response = await this.client.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `
Translate the following text into ${language}.

Text:
${text}
      `,
    });

    return response.text;
  }

  async image({ prompt }) {
    return {
      url: "https://placehold.co/1024x1024/11131b/8b5cf6?text=AIForge",
      prompt,
      message: "Image generation provider will be connected separately.",
    };
  }
}

export function getAIProvider() {
  return new GeminiProvider();
}