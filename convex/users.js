"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onboard = exports.updatePlan = exports.create = exports.getByPhone = void 0;
const server_1 = require("./_generated/server");
const values_1 = require("convex/values");
exports.getByPhone = (0, server_1.query)({
    args: { phone: values_1.v.string() },
    handler: async (ctx, { phone }) => {
        return await ctx.db
            .query("users")
            .withIndex("by_phone", q => q.eq("phone", phone))
            .first();
    },
});
exports.create = (0, server_1.mutation)({
    args: {
        name: values_1.v.string(),
        gender: values_1.v.string(),
        phone: values_1.v.string(),
    },
    handler: async (ctx, { name, gender, phone }) => {
        const existing = await ctx.db
            .query("users")
            .withIndex("by_phone", q => q.eq("phone", phone))
            .first();
        if (existing)
            return existing._id;
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
exports.updatePlan = (0, server_1.mutation)({
    args: {
        userId: values_1.v.id("users"),
        plan: values_1.v.union(values_1.v.literal("trial"), values_1.v.literal("basic"), values_1.v.literal("pro")),
    },
    handler: async (ctx, { userId, plan }) => {
        await ctx.db.patch(userId, { plan });
    },
});
exports.onboard = (0, server_1.mutation)({
    args: {
        name: values_1.v.string(),
        gender: values_1.v.string(),
        phone: values_1.v.string(),
    },
    handler: async (ctx, { name, gender, phone }) => {
        const normalised = phone.replace(/[\s\-\(\)]/g, "");
        const existing = await ctx.db
            .query("users")
            .withIndex("by_phone", q => q.eq("phone", normalised))
            .first();
        if (existing)
            return { userId: existing._id, alreadyExists: true };
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
