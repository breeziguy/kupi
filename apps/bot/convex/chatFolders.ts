import { convex } from "./client.js";
import { api } from "../../../convex/_generated/api.js";
import type { Id } from "../../../convex/_generated/dataModel.js";

export async function findOrCreateFolder(
  userId: Id<"users">,
  personName: string,
  platform: string
) {
  const existing = await convex.query(api.chatFolders.findByUserAndName, {
    userId,
    personName,
  });
  if (existing) return existing;

  await convex.mutation(api.chatFolders.create, {
    userId,
    personName,
    platform,
  });

  return (await convex.query(api.chatFolders.findByUserAndName, {
    userId,
    personName,
  }))!;
}

export async function updateFolder(
  folderId: Id<"chatFolders">,
  fields: {
    messageCount?: number;
    interestLevel?: number;
    compatibilityScore?: number;
    redFlagsCount?: number;
    greenFlagsCount?: number;
  }
) {
  await convex.mutation(api.chatFolders.update, { folderId, ...fields });
}

export async function listFolders(userId: Id<"users">) {
  return await convex.query(api.chatFolders.listByUser, { userId });
}
