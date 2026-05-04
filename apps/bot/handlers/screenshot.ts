import type { Space, Message } from "spectrum-ts";
import { effect, imessage } from "spectrum-ts/providers/imessage";
import { extractScreenshot } from "../ai/vision.js";
import { generateReplies } from "../ai/reply.js";
import { analyzeConversation } from "../ai/analysis.js";
import { findOrCreateFolder, updateFolder } from "../convex/chatFolders.js";
import { logTokens } from "../convex/tokenUsage.js";
import { convex } from "../convex/client.js";
import { api } from "../../../convex/_generated/api.js";

interface ScreenshotUser {
  _id: string;
  name: string;
  gender: string;
}

export async function handleScreenshot(
  space: Space,
  message: Message,
  user: ScreenshotUser
): Promise<void> {
  await space.responding(async () => {
    if (message.content.type !== "attachment") return;
    const imageBuffer = await message.content.read();
    const mimeType = message.content.mimeType ?? "image/jpeg";
    const extracted = await extractScreenshot(imageBuffer, mimeType);
    let totalTokens = extracted.tokensUsed;

    const folder = await findOrCreateFolder(
      user._id as any,
      extracted.personName,
      extracted.platform
    );

    const previousContext =
      folder.messageCount > 0
        ? `Interest: ${folder.interestLevel}/100, Compatibility: ${folder.compatibilityScore}/100`
        : null;

    const [replyResult, analysisResult] = await Promise.all([
      generateReplies({
        userName: user.name,
        userGender: user.gender,
        personName: extracted.personName,
        recentMessages: extracted.messages,
        previousContext,
      }),
      analyzeConversation({
        personName: extracted.personName,
        messages: extracted.messages,
      }),
    ]);

    totalTokens += replyResult.tokensUsed + analysisResult.tokensUsed;

    await updateFolder(folder._id as any, {
      messageCount: folder.messageCount + extracted.messages.length,
      interestLevel: analysisResult.interestLevel,
      compatibilityScore: analysisResult.compatibilityScore,
      redFlagsCount: folder.redFlagsCount + analysisResult.redFlags.length,
      greenFlagsCount: folder.greenFlagsCount + analysisResult.greenFlags.length,
    });

    await convex.mutation(api.analyses.create, {
      chatFolderId: folder._id as any,
      userId: user._id as any,
      type: "rizz_report",
      result: {
        personName: extracted.personName,
        platform: extracted.platform,
        interestLevel: analysisResult.interestLevel,
        compatibilityScore: analysisResult.compatibilityScore,
        redFlags: analysisResult.redFlags,
        greenFlags: analysisResult.greenFlags,
        replyOptions: replyResult.replies,
        rizzType: getRizzType(analysisResult.interestLevel, analysisResult.compatibilityScore),
        riskLevel: getRiskLevel(analysisResult.redFlags.length, analysisResult.compatibilityScore),
        nextMoves: buildNextMoves(analysisResult.redFlags.length, analysisResult.compatibilityScore),
      },
      tokensUsed: totalTokens,
    });

    await logTokens(user._id as any, totalTokens);

    // Header — interest read with optional hype effect on follow-ups
    const isFollowUp = folder.messageCount > 0;
    const header = `${extracted.personName}: ${analysisResult.interestLevel}/100 interest.`;
    if (isFollowUp && analysisResult.interestLevel >= 80) {
      await space.send(effect(header, imessage.effect.message.loud));
    } else if (isFollowUp && analysisResult.interestLevel >= 65) {
      await space.send(effect(header, imessage.effect.message.slam));
    } else if (isFollowUp && analysisResult.greenFlags.length >= 3) {
      await space.send(effect(header, imessage.effect.message.lasers));
    } else {
      await space.send(header);
    }

    // Each reply option as its own message
    for (const reply of replyResult.replies) {
      await space.send(`"${reply}"`);
    }

    // Red flag caution
    if (analysisResult.redFlags.length > 0) {
      await space.send(`Watch out: ${analysisResult.redFlags[0]}`);
    }

    // Full report link
    const webUrl = (process.env.WEB_URL ?? "https://kupi.app").replace(/\/$/, "");
    await space.send(`Full chemistry report: ${webUrl}/rizz-report/${folder._id}`);
  });
}

function getRizzType(interestLevel: number, compatibilityScore: number) {
  if (interestLevel >= 78 && compatibilityScore >= 72) return "Clear Spark";
  if (interestLevel >= 60) return "Soft Interest";
  if (compatibilityScore >= 70) return "Slow Burn";
  return "Mixed Signals";
}

function getRiskLevel(redFlagsCount: number, compatibilityScore: number) {
  if (redFlagsCount >= 3 || compatibilityScore < 35) return "High";
  if (redFlagsCount > 0 || compatibilityScore < 60) return "Medium";
  return "Low";
}

function buildNextMoves(redFlagsCount: number, compatibilityScore: number) {
  if (redFlagsCount >= 2) {
    return [
      "Keep it light until they show consistency",
      "Ask one direct question instead of over-explaining",
      "Do not reward dry replies with essays",
    ];
  }

  if (compatibilityScore >= 70) {
    return [
      "Mirror their energy",
      "Move from small talk into a playful plan",
      "Ask a question that gives them room to flirt back",
    ];
  }

  return [
    "Ask a warmer follow-up",
    "Watch whether they ask about you too",
    "Keep the next text short and easy to answer",
  ];
}
