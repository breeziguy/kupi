"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("convex/server");
const server_2 = require("./_generated/server");
const api_1 = require("./_generated/api");
async function verifyHmac(secret, body, signature) {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const sigBytes = await crypto.subtle.sign("HMAC", key, enc.encode(body));
    const expected = "sha256=" +
        Array.from(new Uint8Array(sigBytes))
            .map(b => b.toString(16).padStart(2, "0"))
            .join("");
    // constant-time comparison
    if (expected.length !== signature.length)
        return false;
    let diff = 0;
    for (let i = 0; i < expected.length; i++) {
        diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
    }
    return diff === 0;
}
const http = (0, server_1.httpRouter)();
http.route({
    path: "/webhooks/polar",
    method: "POST",
    handler: (0, server_2.httpAction)(async (ctx, request) => {
        const secret = process.env.POLAR_WEBHOOK_SECRET;
        if (!secret) {
            return new Response("Webhook secret not configured", { status: 500 });
        }
        const body = await request.text();
        const signature = request.headers.get("webhook-signature") ?? "";
        const isValid = await verifyHmac(secret, body, signature);
        if (!isValid) {
            return new Response("Invalid signature", { status: 401 });
        }
        const event = JSON.parse(body);
        if (event.type === "subscription.created" ||
            event.type === "subscription.updated") {
            const { customer, subscription } = event.data;
            const phone = customer.metadata?.phone;
            if (!phone)
                return new Response("No phone in metadata", { status: 400 });
            const user = await ctx.runQuery(api_1.api.users.getByPhone, { phone });
            if (!user)
                return new Response("User not found", { status: 404 });
            await ctx.runMutation(api_1.api.subscriptions.upsert, {
                userId: user._id,
                polarCustomerId: customer.id,
                polarSubscriptionId: subscription.id,
                plan: subscription.product.name.toLowerCase(),
                status: subscription.status,
                currentPeriodEnd: new Date(subscription.current_period_end).getTime(),
            });
        }
        return new Response("OK", { status: 200 });
    }),
});
exports.default = http;
