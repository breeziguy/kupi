import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

async function verifyHmac(
  secret: string,
  body: string,
  signature: string
): Promise<boolean> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBytes = await crypto.subtle.sign("HMAC", key, enc.encode(body));
  const expected =
    "sha256=" +
    Array.from(new Uint8Array(sigBytes))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");

  // constant-time comparison
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return diff === 0;
}

const http = httpRouter();

http.route({
  path: "/webhooks/polar",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
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

    const event = JSON.parse(body) as {
      type: string;
      data: {
        customer: { id: string; metadata?: Record<string, unknown> };
        subscription: {
          id: string;
          status: string;
          current_period_end: string;
          product: { name: string };
        };
      };
    };

    if (
      event.type === "subscription.created" ||
      event.type === "subscription.updated"
    ) {
      const { customer, subscription } = event.data;
      const phone = customer.metadata?.phone as string | undefined;
      if (!phone) return new Response("No phone in metadata", { status: 400 });

      const user = await ctx.runQuery(api.users.getByPhone, { phone });
      if (!user) return new Response("User not found", { status: 404 });

      await ctx.runMutation(api.subscriptions.upsert, {
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

export default http;
