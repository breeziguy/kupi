import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const findByUserAndName = query({
  args: { userId: v.id("users"), personName: v.string() },
  handler: async (ctx, { userId, personName }) => {
    const folders = await ctx.db
      .query("chatFolders")
      .withIndex("by_userId", q => q.eq("userId", userId))
      .collect();
    return folders.find(
      f => f.personName.toLowerCase() === personName.toLowerCase()
    ) ?? null;
  },
});

export const listByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("chatFolders")
      .withIndex("by_userId_lastUpdated", q => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const getById = query({
  args: { folderId: v.id("chatFolders") },
  handler: async (ctx, { folderId }) => {
    return await ctx.db.get(folderId);
  },
});

export const create = mutation({
  args: {
    userId: v.id("users"),
    personName: v.string(),
    platform: v.string(),
  },
  handler: async (ctx, { userId, personName, platform }) => {
    return await ctx.db.insert("chatFolders", {
      userId,
      personName,
      platform,
      messageCount: 0,
      interestLevel: 50,
      compatibilityScore: 50,
      redFlagsCount: 0,
      greenFlagsCount: 0,
      lastUpdated: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    folderId: v.id("chatFolders"),
    messageCount: v.optional(v.number()),
    interestLevel: v.optional(v.number()),
    compatibilityScore: v.optional(v.number()),
    redFlagsCount: v.optional(v.number()),
    greenFlagsCount: v.optional(v.number()),
  },
  handler: async (ctx, { folderId, ...fields }) => {
    const patch: Record<string, unknown> = { lastUpdated: Date.now() };
    for (const [k, val] of Object.entries(fields)) {
      if (val !== undefined) patch[k] = val;
    }
    await ctx.db.patch(folderId, patch);
  },
});
