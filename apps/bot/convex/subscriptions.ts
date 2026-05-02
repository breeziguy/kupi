import { convex } from "./client.js";
import { api } from "../../../convex/_generated/api.js";
import type { Id } from "../../../convex/_generated/dataModel.js";

export async function getSubscription(userId: Id<"users">) {
  return await convex.query(api.subscriptions.getByUser, { userId });
}
