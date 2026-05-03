"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("convex/server");
const values_1 = require("convex/values");
exports.default = (0, server_1.defineSchema)({
    users: (0, server_1.defineTable)({
        name: values_1.v.string(),
        gender: values_1.v.string(),
        phone: values_1.v.string(),
        plan: values_1.v.union(values_1.v.literal("trial"), values_1.v.literal("basic"), values_1.v.literal("pro")),
        trialEndsAt: values_1.v.number(),
        createdAt: values_1.v.number(),
    }).index("by_phone", ["phone"]),
    chatFolders: (0, server_1.defineTable)({
        userId: values_1.v.id("users"),
        personName: values_1.v.string(),
        platform: values_1.v.string(),
        messageCount: values_1.v.number(),
        interestLevel: values_1.v.number(),
        compatibilityScore: values_1.v.number(),
        redFlagsCount: values_1.v.number(),
        greenFlagsCount: values_1.v.number(),
        lastUpdated: values_1.v.number(),
    })
        .index("by_userId", ["userId"])
        .index("by_userId_lastUpdated", ["userId", "lastUpdated"]),
    analyses: (0, server_1.defineTable)({
        chatFolderId: values_1.v.id("chatFolders"),
        userId: values_1.v.id("users"),
        type: values_1.v.string(),
        result: values_1.v.any(),
        tokensUsed: values_1.v.number(),
        createdAt: values_1.v.number(),
    }).index("by_chatFolder", ["chatFolderId"]),
    tokenUsage: (0, server_1.defineTable)({
        userId: values_1.v.id("users"),
        month: values_1.v.string(),
        tokensUsed: values_1.v.number(),
        limit: values_1.v.number(),
    }).index("by_user_month", ["userId", "month"]),
    subscriptions: (0, server_1.defineTable)({
        userId: values_1.v.id("users"),
        polarCustomerId: values_1.v.string(),
        polarSubscriptionId: values_1.v.string(),
        plan: values_1.v.string(),
        status: values_1.v.string(),
        currentPeriodEnd: values_1.v.number(),
    }).index("by_userId", ["userId"]),
});
