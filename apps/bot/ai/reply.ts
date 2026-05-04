import { openai } from "./client.js";
import { config } from "../config.js";

interface ReplyInput {
  userName: string;
  userGender: string;
  personName: string;
  recentMessages: Array<{ sender: "me" | "them"; text: string }>;
  previousContext: string | null;
}

export interface ReplyResult {
  replies: string[];
  tokensUsed: number;
}

export async function generateReplies(input: ReplyInput): Promise<ReplyResult> {
  const convo = input.recentMessages
    .map(m => `${m.sender === "me" ? input.userName : input.personName}: ${m.text}`)
    .join("\n");

  const systemPrompt = `You are ${config.wingmanName}, a sharp dating wingman texting with ${input.userName} (${input.userGender}).
Suggest replies that sound like a real person wrote them in iMessage.
No pickup-line voice, no therapy voice, no "as an AI" energy.
Match the conversation's pace: if they are dry, keep it light; if they are warm, lean in.
Each reply should be short enough to text, specific to what they said, and a little confident without sounding try-hard.
${input.previousContext ? `Context about ${input.personName}: ${input.previousContext}` : ""}`;

  const response = await openai.chat.completions.create({
    model: config.ai.model,
    max_tokens: config.ai.maxTokens,
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Here's the conversation:\n${convo}\n\nGive me 3 reply options as JSON: { "replies": ["...", "...", "..."] }. Return ONLY valid JSON.`,
      },
    ],
  });

  const content = response.choices[0].message.content ?? "{}";
  let parsed: any = {};
  try {
    const clean = content.replace(/^```[a-z]*\n?/m, "").replace(/```$/m, "").trim();
    parsed = JSON.parse(clean);
  } catch {
    // malformed response — return defaults below
  }

  return {
    replies: parsed.replies ?? [],
    tokensUsed: response.usage?.total_tokens ?? 0,
  };
}
