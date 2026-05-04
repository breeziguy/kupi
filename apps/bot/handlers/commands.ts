import type { Space, Message } from "spectrum-ts";
import { effect, imessage } from "spectrum-ts/providers/imessage";
import { listFolders } from "../convex/chatFolders.js";
import { createMemory, listMemories } from "../convex/memories.js";
import { logTokens } from "../convex/tokenUsage.js";
import { generateConversationReply } from "../ai/conversation.js";
import { generateWrap } from "../ai/wrap.js";
import { sendKupiContact } from "./sendContact.js";
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

  if (isGreeting(text)) {
    await handleGreeting(space, user);
    return;
  }

  if (text === "help" || text === "?") {
    await handleHelp(space);
    return;
  }

  if (text === "save" || text === "save contact" || text === "contact") {
    await sendKupiContact(space);
    return;
  }

  if (text.startsWith("wrap")) {
    await handleWrap(space, user);
    return;
  }

  if (isReportRequest(text)) {
    await handleRizzReport(space, user);
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

  await handleNaturalText(space, message, user);
}

function isGreeting(text: string) {
  const compact = text.replace(/[!?.]/g, "").trim();
  return [
    "hey",
    "hi",
    "hello",
    "yo",
    "hey kupi",
    "hi kupi",
    "hello kupi",
    "start",
  ].includes(compact);
}

async function handleGreeting(space: Space, user: CommandUser): Promise<void> {
  await space.responding(async () => {
    const folders = await listFolders(user._id as any);

    if (folders.length === 0) {
      await space.send(
        effect(
          `You're in. I'm ${config.wingmanName} AI — your personal wingman.`,
          imessage.effect.message.celebration
        )
      );
      await space.send(
        `Text me like a friend. Send screenshots when you want the read, or just tell me the situation and I'll help you make the next move.`
      );
      await sendKupiContact(space);
      return;
    }

    await space.send(
      `Back in the lab. Send the latest screenshot or tell me what changed.`
    );
  });
}

async function handleNaturalText(
  space: Space,
  message: Message,
  user: CommandUser
): Promise<void> {
  await space.responding(async () => {
    if (message.content.type !== "text") return;
    const text = message.content.text;
    await reactToBanter(message, text);

    const [folders, memories] = await Promise.all([
      listFolders(user._id as any),
      listMemories(user._id as any),
    ]);

    const result = await generateConversationReply({
      userName: user.name,
      userGender: user.gender,
      text,
      memories: memories.map(memory => memory.content),
      chatFolders: folders,
    });

    await Promise.all([
      logTokens(user._id as any, result.tokensUsed),
      ...result.memories.map(memory =>
        createMemory(user._id as any, memory.content, "conversation", memory.importance)
      ),
    ]);

    if (result.tone === "joke") {
      await space.send(effect(result.reply, imessage.effect.message.spotlight));
    } else if (result.tone === "hype") {
      await space.send(effect(result.reply, imessage.effect.message.loud));
    } else {
      await space.send(result.reply);
    }
  });
}

async function handleHelp(space: Space): Promise<void> {
  await space.send(
    `Send a chat screenshot and I'll give you:\n\n` +
      `1. the vibe read\n` +
      `2. reply options that sound like you\n` +
      `3. any red flags worth noticing\n\n` +
      `You can also text "wrap", "report", "analysis", or "red flags".`
  );
}

async function handleWrap(space: Space, user: CommandUser): Promise<void> {
  await space.responding(async () => {
    const folders = await listFolders(user._id as any);
    if (folders.length === 0) {
      await space.send("Nothing to wrap yet. Send me a screenshot first.");
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
      `${folder.personName} read:\n\n` +
        `${wrap.summary}\n\n` +
        `Interest: ${folder.interestLevel}/100\n` +
        `Compatibility: ${folder.compatibilityScore}/100\n` +
        `Red flags: ${folder.redFlagsCount}\n` +
        `Green flags: ${folder.greenFlagsCount}\n\n` +
        `Move: ${wrap.verdict}`
    );
  });
}

async function handleRedFlags(space: Space, user: CommandUser): Promise<void> {
  await space.responding(async () => {
    const folders = await usableFolders(user._id as any);
    if (folders.length === 0) {
      await space.send("No reads yet. Send me a screenshot first.");
      return;
    }

    const withFlags = folders.filter((f: any) => f.redFlagsCount > 0);
    if (withFlags.length === 0) {
      await space.send("No real red flags so far. Nothing scary in the file.");
      return;
    }

    const lines = withFlags
      .map(
        (f: any) =>
          `🚩 ${f.personName}: ${f.redFlagsCount} flag${f.redFlagsCount > 1 ? "s" : ""}`
      )
      .join("\n");

    await space.send(`Stuff to watch:\n\n${lines}`);
  });
}

async function handleAnalysis(space: Space, user: CommandUser): Promise<void> {
  await space.responding(async () => {
    const folders = await usableFolders(user._id as any);
    if (folders.length === 0) {
      await space.send("I need a chat screenshot before I can read the room.");
      return;
    }

    const folder = folders[0];
    await space.send(
      `${folder.personName}:\n\n` +
        `Interest: ${folder.interestLevel}/100\n` +
        `Compatibility: ${folder.compatibilityScore}/100\n` +
        `Red flags: ${folder.redFlagsCount}\n` +
        `Green flags: ${folder.greenFlagsCount}\n` +
        `Messages read: ${folder.messageCount}\n\n` +
        `Full report: ${reportUrl(folder._id)}`
    );
  });
}

async function handleRizzReport(space: Space, user: CommandUser): Promise<void> {
  await space.responding(async () => {
    const folders = await usableFolders(user._id as any);
    if (folders.length === 0) {
      await space.send("I need one chat screenshot first, then I'll make the full Rizz Report.");
      return;
    }

    const folder = folders[0];
    const opener = user.gender === "female" ? "Gurl, I have the read." : "Damn bruh, I have the read.";
    await space.send(
      `${opener}\n\n` +
        `${folder.personName}: ${folder.interestLevel}/100 interest, ${folder.compatibilityScore}/100 compatibility.\n\n` +
        `Full Rizz Report: ${reportUrl(folder._id)}`
    );
  });
}

function isReportRequest(text: string) {
  return (
    text.includes("rizz report") ||
    text === "report" ||
    text.includes("send report") ||
    text.includes("full report")
  );
}

async function usableFolders(userId: any) {
  const folders = await listFolders(userId);
  return folders.filter((folder: any) => folder.personName !== "KUPI Memory");
}

function reportUrl(folderId: string) {
  const baseUrl = process.env.WEB_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
  return `${baseUrl.replace(/\/$/, "")}/rizz-report/${folderId}`;
}

async function reactToBanter(message: Message, text: string) {
  if (!/(lol|lmao|haha|damn|gurl|bruh|rizz)/i.test(text)) return;
  const react = (message as any).react;
  if (typeof react !== "function") return;

  try {
    await react.call(message, /lol|lmao|haha/i.test(text) ? "😂" : "🔥");
  } catch {
    // Reactions are a nice-to-have; never block the reply if iMessage skips one.
  }
}
