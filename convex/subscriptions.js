"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.upsert = exports.getByUser = void 0;
const server_1 = require("./_generated/server");
const values_1 = require("convex/values");
exports.getByUser = (0, server_1.query)({
    args: { userId: values_1.v.id("users") },
    handler: async (ctx, { userId }) => {
        return await ctx.db
            .query("subscriptions")
            .withIndex("by_userId", q => q.eq("userId", userId))
            .first();
    },
});
exports.upsert = (0, server_1.mutation)({
    args: {
        userId: values_1.v.id("users"),
        polarCustomerId: values_1.v.string(),
        polarSubscriptionId: values_1.v.string(),
        plan: values_1.v.string(),
        status: values_1.v.string(),
        currentPeriodEnd: values_1.v.number(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("subscriptions")
            .withIndex("by_userId", q => q.eq("userId", args.userId))
            .first();
        if (existing) {
            await ctx.db.patch(existing._id, {
                polarSubscriptionId: args.polarSubscriptionId,
                plan: args.plan,
                status: args.status,
                currentPeriodEnd: args.currentPeriodEnd,
            });
        }
        else {
            await ctx.db.insert("subscriptions", args);
        }
        if (args.status === "active") {
            const validPlan = ["basic", "pro"].includes(args.plan) ? args.plan : "basic";
            await ctx.db.patch(args.userId, {
                plan: validPlan,
            });
        }
    },
});
