"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getForMonth = exports.log = void 0;
const server_1 = require("./_generated/server");
const values_1 = require("convex/values");
function currentMonth() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
exports.log = (0, server_1.mutation)({
    args: { userId: values_1.v.id("users"), tokensUsed: values_1.v.number() },
    handler: async (ctx, { userId, tokensUsed }) => {
        const month = currentMonth();
        const existing = await ctx.db
            .query("tokenUsage")
            .withIndex("by_user_month", q => q.eq("userId", userId).eq("month", month))
            .first();
        if (existing) {
            await ctx.db.patch(existing._id, {
                tokensUsed: existing.tokensUsed + tokensUsed,
            });
        }
        else {
            await ctx.db.insert("tokenUsage", {
                userId,
                month,
                tokensUsed,
                limit: 2_000_000,
            });
        }
    },
});
exports.getForMonth = (0, server_1.query)({
    args: { userId: values_1.v.id("users") },
    handler: async (ctx, { userId }) => {
        const month = currentMonth();
        return await ctx.db
            .query("tokenUsage")
            .withIndex("by_user_month", q => q.eq("userId", userId).eq("month", month))
            .first();
    },
});
