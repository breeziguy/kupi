import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
function currentMonth() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
export const log = mutation({
    args: { userId: v.id("users"), tokensUsed: v.number() },
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
export const getForMonth = query({
    args: { userId: v.id("users") },
    handler: async (ctx, { userId }) => {
        const month = currentMonth();
        return await ctx.db
            .query("tokenUsage")
            .withIndex("by_user_month", q => q.eq("userId", userId).eq("month", month))
            .first();
    },
});
