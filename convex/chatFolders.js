"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.update = exports.create = exports.listByUser = exports.findByUserAndName = void 0;
const server_1 = require("./_generated/server");
const values_1 = require("convex/values");
exports.findByUserAndName = (0, server_1.query)({
    args: { userId: values_1.v.id("users"), personName: values_1.v.string() },
    handler: async (ctx, { userId, personName }) => {
        const folders = await ctx.db
            .query("chatFolders")
            .withIndex("by_userId", q => q.eq("userId", userId))
            .collect();
        return folders.find(f => f.personName.toLowerCase() === personName.toLowerCase()) ?? null;
    },
});
exports.listByUser = (0, server_1.query)({
    args: { userId: values_1.v.id("users") },
    handler: async (ctx, { userId }) => {
        return await ctx.db
            .query("chatFolders")
            .withIndex("by_userId_lastUpdated", q => q.eq("userId", userId))
            .order("desc")
            .collect();
    },
});
exports.create = (0, server_1.mutation)({
    args: {
        userId: values_1.v.id("users"),
        personName: values_1.v.string(),
        platform: values_1.v.string(),
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
exports.update = (0, server_1.mutation)({
    args: {
        folderId: values_1.v.id("chatFolders"),
        messageCount: values_1.v.optional(values_1.v.number()),
        interestLevel: values_1.v.optional(values_1.v.number()),
        compatibilityScore: values_1.v.optional(values_1.v.number()),
        redFlagsCount: values_1.v.optional(values_1.v.number()),
        greenFlagsCount: values_1.v.optional(values_1.v.number()),
    },
    handler: async (ctx, { folderId, ...fields }) => {
        const patch = { lastUpdated: Date.now() };
        for (const [k, val] of Object.entries(fields)) {
            if (val !== undefined)
                patch[k] = val;
        }
        await ctx.db.patch(folderId, patch);
    },
});
