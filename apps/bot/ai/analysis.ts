import { openai } from "./client.js";
import { config } from "../config.js";

interface AnalysisInput {
  personName: string;
  messages: Array<{ sender: "me" | "them"; text: string }>;
}

export interface AnalysisResult {
  interestLevel: number;
  compatibilityScore: number;
  redFlags: string[];
  greenFlags: string[];
  tokensUsed: number;
}

export async function analyzeConversation(
  input: AnalysisInput
): Promise<AnalysisResult> {
  const convo = input.messages
    .map(m => `${m.sender === "me" ? "User" : input.personName}: ${m.text}`)
    .join("\n");

  const response = await openai.chat.completions.create({
    model: config.ai.model,
    max_tokens: config.ai.maxTokens,
    messages: [
      {
        role: "system",
        content: `You are ${config.wingmanName}, an expert at reading romantic conversations.
Analyze the conversation and return a JSON object with:
- interestLevel: 0-100 (how interested the other person is)
- compatibilityScore: 0-100
- redFlags: string[] (concerning patterns, max 5)
- greenFlags: string[] (positive signals, max 5)
Return ONLY valid JSON.`,
      },
      { role: "user", content: convo },
    ],
  });

  const content = response.choices[0].message.content ?? "{}";
  const parsed = JSON.parse(content);

  return {
    interestLevel: parsed.interestLevel ?? 50,
    compatibilityScore: parsed.compatibilityScore ?? 50,
    redFlags: parsed.redFlags ?? [],
    greenFlags: parsed.greenFlags ?? [],
    tokensUsed: response.usage?.total_tokens ?? 0,
  };
}
