import type { Space, Message } from "spectrum-ts";
import { extractScreenshot } from "../ai/vision.js";
import { generateReplies } from "../ai/reply.js";
import { analyzeConversation } from "../ai/analysis.js";
import { findOrCreateFolder, updateFolder } from "../convex/chatFolders.js";
import { logTokens } from "../convex/tokenUsage.js";
import { convex } from "../convex/client.js";
import { config } from "../config.js";

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

    await logTokens(user._id as any, totalTokens);

    const repliesText = replyResult.replies
      .map((r, i) => `${i + 1}. ${r}`)
      .join("\n\n");

    await space.send(
      `📁 ${extracted.personName} (${extracted.platform})\n` +
      `💫 Interest: ${analysisResult.interestLevel}/100\n\n` +
      `Here are your moves:\n\n${repliesText}`
    );

    if (analysisResult.redFlags.length > 0) {
      await space.send(`🚩 Heads up — ${analysisResult.redFlags[0]}`);
    }
  });
}
