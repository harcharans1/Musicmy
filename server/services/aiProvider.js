export class DemoProvider {
  constructor() {
    this.name = "demo";
  }

  async generate({ prompt, type }) {
    return `Demo AI response.

Type: ${type || "text"}

Prompt:
${prompt}

DEMO_MODE is enabled. Configure an AI provider to connect a live AI model.`;
  }

  async image({ prompt }) {
    return {
      url: "https://placehold.co/1024x1024/11131b/8b5cf6?text=AIForge+Demo",
      prompt,
    };
  }

  async summarize({ text }) {
    return `Demo summary:

${text.slice(0, 700)}

[Generated in demo mode]`;
  }

  async translate({ text, language }) {
    return `[Demo ${language || "English"} translation]

${text}`;
  }
}

export function getAIProvider() {
  return new DemoProvider();
}