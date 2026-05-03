"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listByFolder = exports.create = void 0;
const server_1 = require("./_generated/server");
const values_1 = require("convex/values");
exports.create = (0, server_1.mutation)({
    args: {
        chatFolderId: values_1.v.id("chatFolders"),
        userId: values_1.v.id("users"),
        type: values_1.v.string(),
        result: values_1.v.any(),
        tokensUsed: values_1.v.number(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("analyses", {
            ...args,
            createdAt: Date.now(),
        });
    },
});
exports.listByFolder = (0, server_1.query)({
    args: { chatFolderId: values_1.v.id("chatFolders") },
    handler: async (ctx, { chatFolderId }) => {
        return await ctx.db
            .query("analyses")
            .withIndex("by_chatFolder", q => q.eq("chatFolderId", chatFolderId))
            .order("desc")
            .take(20);
    },
});
