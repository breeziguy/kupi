import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", q => q.eq("userId", userId))
      .first();
  },
});

export const upsert = mutation({
  args: {
    userId: v.id("users"),
    polarCustomerId: v.string(),
    polarSubscriptionId: v.string(),
    plan: v.string(),
    status: v.string(),
    currentPeriodEnd: v.number(),
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
    } else {
      await ctx.db.insert("subscriptions", args);
    }

    if (args.status === "active") {
      const validPlan = ["basic", "pro"].includes(args.plan) ? args.plan : "basic";
      await ctx.db.patch(args.userId, {
        plan: validPlan as "basic" | "pro",
      });
    }
  },
});
