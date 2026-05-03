import { openai } from "./client.js";
import { config } from "../config.js";

interface WrapInput {
  personName: string;
  interestLevel: number;
  compatibilityScore: number;
  redFlagsCount: number;
  greenFlagsCount: number;
  messageCount: number;
}

export interface WrapResult {
  summary: string;
  verdict: string;
  tokensUsed: number;
}

export async function generateWrap(input: WrapInput): Promise<WrapResult> {
  const response = await openai.chat.completions.create({
    model: config.ai.model,
    max_tokens: config.ai.maxTokens,
    messages: [
      {
        role: "system",
        content: `You are ${config.wingmanName}. Give an honest, direct wrap-up of a conversation.`,
      },
      {
        role: "user",
        content: `Give me a wrap on my conversation with ${input.personName}.
Stats:
- Messages exchanged: ${input.messageCount}
- Their interest level: ${input.interestLevel}/100
- Compatibility: ${input.compatibilityScore}/100
- Red flags: ${input.redFlagsCount}
- Green flags: ${input.greenFlagsCount}

Return JSON: { "summary": "...", "verdict": "..." }. Return ONLY valid JSON.`,
      },
    ],
  });

  const content = response.choices[0].message.content ?? "{}";
  let parsed: Record<string, unknown> = {};
  try {
    const clean = content.replace(/^```[a-z]*\n?/m, "").replace(/```$/m, "").trim();
    parsed = JSON.parse(clean);
  } catch {
    // malformed response — return defaults below
  }

  return {
    summary: parsed.summary ?? "",
    verdict: parsed.verdict ?? "",
    tokensUsed: response.usage?.total_tokens ?? 0,
  };
}
