import { openai } from "./client.js";
import { config } from "../config.js";

export interface ExtractedScreenshot {
  personName: string;
  platform: string;
  messages: Array<{ sender: "me" | "them"; text: string }>;
  tokensUsed: number;
}

export async function extractScreenshot(
  imageBuffer: Buffer
): Promise<ExtractedScreenshot> {
  const base64 = imageBuffer.toString("base64");

  const response = await openai.chat.completions.create({
    model: config.ai.visionModel,
    max_tokens: config.ai.maxTokens,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Analyze this chat screenshot and return a JSON object with:
- personName: the name of the person being chatted with (string)
- platform: one of "tinder", "instagram", "whatsapp", "other"
- messages: array of { sender: "me" | "them", text: string } in order

Return ONLY valid JSON, no markdown.`,
          },
          {
            type: "image_url",
            image_url: { url: `data:image/jpeg;base64,${base64}` },
          },
        ],
      },
    ],
  });

  const content = response.choices[0].message.content ?? "{}";
  const parsed = JSON.parse(content);

  return {
    personName: parsed.personName ?? "Unknown",
    platform: parsed.platform ?? "other",
    messages: parsed.messages ?? [],
    tokensUsed: response.usage?.total_tokens ?? 0,
  };
}
