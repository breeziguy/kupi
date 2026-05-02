import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getByPhone = query({
  args: { phone: v.string() },
  handler: async (ctx, { phone }) => {
    return await ctx.db
      .query("users")
      .withIndex("by_phone", q => q.eq("phone", phone))
      .first();
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    gender: v.string(),
    phone: v.string(),
  },
  handler: async (ctx, { name, gender, phone }) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_phone", q => q.eq("phone", phone))
      .first();
    if (existing) return existing._id;

    const trialEndsAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
    return await ctx.db.insert("users", {
      name,
      gender,
      phone,
      plan: "trial",
      trialEndsAt,
      createdAt: Date.now(),
    });
  },
});

export const updatePlan = mutation({
  args: {
    userId: v.id("users"),
    plan: v.union(v.literal("trial"), v.literal("basic"), v.literal("pro")),
  },
  handler: async (ctx, { userId, plan }) => {
    await ctx.db.patch(userId, { plan });
  },
});

export const onboard = mutation({
  args: {
    name: v.string(),
    gender: v.string(),
    phone: v.string(),
  },
  handler: async (ctx, { name, gender, phone }) => {
    const normalised = phone.replace(/[\s\-\(\)]/g, "");

    const existing = await ctx.db
      .query("users")
      .withIndex("by_phone", q => q.eq("phone", normalised))
      .first();

    if (existing) return { userId: existing._id, alreadyExists: true };

    const trialEndsAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
    const userId = await ctx.db.insert("users", {
      name,
      gender,
      phone: normalised,
      plan: "trial",
      trialEndsAt,
      createdAt: Date.now(),
    });

    return { userId, alreadyExists: false };
  },
});
