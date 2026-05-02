import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";
import { createHmac } from "crypto";

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
    const expected = createHmac("sha256", secret).update(body).digest("hex");

    if (signature !== `sha256=${expected}`) {
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
