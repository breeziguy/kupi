import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const create = mutation({
  args: {
    chatFolderId: v.id("chatFolders"),
    userId: v.id("users"),
    type: v.string(),
    result: v.any(),
    tokensUsed: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("analyses", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const listByFolder = query({
  args: { chatFolderId: v.id("chatFolders") },
  handler: async (ctx, { chatFolderId }) => {
    return await ctx.db
      .query("analyses")
      .withIndex("by_chatFolder", q => q.eq("chatFolderId", chatFolderId))
      .order("desc")
      .take(20);
  },
});
