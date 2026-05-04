import { convex } from "./client.js";
import { api } from "../../../convex/_generated/api.js";
import type { Id } from "../../../convex/_generated/dataModel.js";

const MEMORY_FOLDER = "KUPI Memory";

async function getMemoryFolder(userId: Id<"users">) {
  const existing = await convex.query(api.chatFolders.findByUserAndName, {
    userId,
    personName: MEMORY_FOLDER,
  });
  if (existing) return existing;

  await convex.mutation(api.chatFolders.create, {
    userId,
    personName: MEMORY_FOLDER,
    platform: "imessage",
  });

  return (await convex.query(api.chatFolders.findByUserAndName, {
    userId,
    personName: MEMORY_FOLDER,
  }))!;
}

export async function listMemories(userId: Id<"users">, limit = 12) {
  const folder = await convex.query(api.chatFolders.findByUserAndName, {
    userId,
    personName: MEMORY_FOLDER,
  });
  if (!folder) return [];

  const analyses = await convex.query(api.analyses.listByFolder, {
    chatFolderId: folder._id,
  });

  return analyses
    .filter(item => item.type === "memory")
    .slice(0, limit)
    .map(item => ({
      content: String(item.result?.content ?? ""),
      importance: Number(item.result?.importance ?? 0.5),
    }))
    .filter(memory => memory.content.length > 0);
}

export async function createMemory(
  userId: Id<"users">,
  content: string,
  source: string,
  importance: number
) {
  const existing = await listMemories(userId, 30);
  if (existing.some(memory => memory.content.toLowerCase() === content.toLowerCase())) {
    return;
  }

  const folder = await getMemoryFolder(userId);
  await convex.mutation(api.analyses.create, {
    chatFolderId: folder._id,
    userId,
    type: "memory",
    result: { content, source, importance },
    tokensUsed: 0,
  });
}
