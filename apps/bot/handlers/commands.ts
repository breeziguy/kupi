import type { Space, Message } from "spectrum-ts";
import { listFolders } from "../convex/chatFolders.js";
import { logTokens } from "../convex/tokenUsage.js";
import { generateWrap } from "../ai/wrap.js";
import { config } from "../config.js";

interface CommandUser {
  _id: string;
  name: string;
  gender: string;
}

export async function handleCommand(
  space: Space,
  message: Message,
  user: CommandUser
): Promise<void> {
  if (message.content.type !== "text") return;
  const text = message.content.text.toLowerCase().trim();

  if (text === "help" || text === "?") {
    await handleHelp(space);
    return;
  }

  if (text.startsWith("wrap")) {
    await handleWrap(space, user);
    return;
  }

  if (text.includes("red flag") || text.includes("red flags")) {
    await handleRedFlags(space, user);
    return;
  }

  if (
    text.includes("analysis") ||
    text.includes("analyse") ||
    text.includes("analyze")
  ) {
    await handleAnalysis(space, user);
    return;
  }

  await space.send(
    `Send me a screenshot of your chat and I'll get to work 📸\n\nOr type "help" for all commands.`
  );
}

async function handleHelp(space: Space): Promise<void> {
  await space.send(
    `Hey, I'm ${config.wingmanName} — your wingman 🔥\n\n` +
      `Here's what I can do:\n\n` +
      `📸 Send a screenshot → get reply suggestions + vibe check\n` +
      `"wrap" → full summary on whoever you're talking to\n` +
      `"red flags" → red flags detected across your chats\n` +
      `"analysis" → interest level, compatibility, flags breakdown\n` +
      `"help" → this menu`
  );
}

async function handleWrap(space: Space, user: CommandUser): Promise<void> {
  await space.responding(async () => {
    const folders = await listFolders(user._id as any);
    if (folders.length === 0) {
      await space.send("No chats yet — send me a screenshot first 📸");
      return;
    }

    const folder = folders[0];
    const wrap = await generateWrap({
      personName: folder.personName,
      interestLevel: folder.interestLevel,
      compatibilityScore: folder.compatibilityScore,
      redFlagsCount: folder.redFlagsCount,
      greenFlagsCount: folder.greenFlagsCount,
      messageCount: folder.messageCount,
    });

    await logTokens(user._id as any, wrap.tokensUsed);

    await space.send(
      `📊 Wrap: ${folder.personName}\n\n` +
        `${wrap.summary}\n\n` +
        `💬 ${folder.messageCount} messages\n` +
        `💫 Interest: ${folder.interestLevel}/100\n` +
        `🔗 Compatibility: ${folder.compatibilityScore}/100\n` +
        `🚩 Red flags: ${folder.redFlagsCount}\n` +
        `✅ Green flags: ${folder.greenFlagsCount}\n\n` +
        `Verdict: ${wrap.verdict}`
    );
  });
}

async function handleRedFlags(space: Space, user: CommandUser): Promise<void> {
  await space.responding(async () => {
    const folders = await listFolders(user._id as any);
    if (folders.length === 0) {
      await space.send("No chats yet — send me a screenshot first 📸");
      return;
    }

    const withFlags = folders.filter(f => f.redFlagsCount > 0);
    if (withFlags.length === 0) {
      await space.send("No red flags detected so far. Looks clean 🟢");
      return;
    }

    const lines = withFlags
      .map(
        f =>
          `🚩 ${f.personName}: ${f.redFlagsCount} flag${f.redFlagsCount > 1 ? "s" : ""}`
      )
      .join("\n");

    await space.send(`Red flag summary:\n\n${lines}`);
  });
}

async function handleAnalysis(space: Space, user: CommandUser): Promise<void> {
  await space.responding(async () => {
    const folders = await listFolders(user._id as any);
    if (folders.length === 0) {
      await space.send("No chats yet — send me a screenshot first 📸");
      return;
    }

    const folder = folders[0];
    await space.send(
      `📊 Analysis: ${folder.personName}\n\n` +
        `💫 Interest level: ${folder.interestLevel}/100\n` +
        `🔗 Compatibility: ${folder.compatibilityScore}/100\n` +
        `🚩 Red flags: ${folder.redFlagsCount}\n` +
        `✅ Green flags: ${folder.greenFlagsCount}\n` +
        `💬 Messages tracked: ${folder.messageCount}`
    );
  });
}
