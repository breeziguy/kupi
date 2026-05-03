import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    gender: v.string(),
    phone: v.string(),
    plan: v.union(
      v.literal("trial"),
      v.literal("basic"),
      v.literal("pro")
    ),
    trialEndsAt: v.number(),
    createdAt: v.number(),
  }).index("by_phone", ["phone"]),

  chatFolders: defineTable({
    userId: v.id("users"),
    personName: v.string(),
    platform: v.string(),
    messageCount: v.number(),
    interestLevel: v.number(),
    compatibilityScore: v.number(),
    redFlagsCount: v.number(),
    greenFlagsCount: v.number(),
    lastUpdated: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_lastUpdated", ["userId", "lastUpdated"]),

  analyses: defineTable({
    chatFolderId: v.id("chatFolders"),
    userId: v.id("users"),
    type: v.string(),
    result: v.any(),
    tokensUsed: v.number(),
    createdAt: v.number(),
  }).index("by_chatFolder", ["chatFolderId"]),

  tokenUsage: defineTable({
    userId: v.id("users"),
    month: v.string(),
    tokensUsed: v.number(),
    limit: v.number(),
  }).index("by_user_month", ["userId", "month"]),

  subscriptions: defineTable({
    userId: v.id("users"),
    polarCustomerId: v.string(),
    polarSubscriptionId: v.string(),
    plan: v.string(),
    status: v.string(),
    currentPeriodEnd: v.number(),
  }).index("by_userId", ["userId"]),
});
