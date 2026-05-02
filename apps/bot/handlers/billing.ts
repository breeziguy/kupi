import type { Space } from "spectrum-ts";
import { getSubscription } from "../convex/subscriptions.js";
import { config } from "../config.js";

const POLAR_CHECKOUT_URL =
  process.env.POLAR_CHECKOUT_URL ?? "https://polar.sh/kupi/plans";

export interface BillingUser {
  _id: string;
  name: string;
  plan: "trial" | "basic" | "pro";
  trialEndsAt: number;
}

export async function checkBilling(
  space: Space,
  user: BillingUser
): Promise<boolean> {
  if (user.plan !== "trial") {
    const sub = await getSubscription(user._id as any);
    if (sub && sub.status === "active") return true;
  }

  if (user.plan === "trial" && Date.now() < user.trialEndsAt) {
    const daysLeft = Math.ceil(
      (user.trialEndsAt - Date.now()) / (1000 * 60 * 60 * 24)
    );
    if (daysLeft <= config.trial.warningDaysBeforeEnd) {
      await space.send(
        `⏳ Heads up ${user.name} — your free trial ends in ${daysLeft} day${daysLeft === 1 ? "" : "s"}. Pick a plan to keep the momentum: ${POLAR_CHECKOUT_URL}`
      );
    }
    return true;
  }

  await space.send(
    `Hey ${user.name}, your free trial ended 🔒\n\nPick a plan and let's get back to it:\n${POLAR_CHECKOUT_URL}`
  );
  return false;
}
