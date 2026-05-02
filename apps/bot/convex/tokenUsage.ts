import { convex } from "./client.js";
import { api } from "../../../convex/_generated/api.js";
import type { Id } from "../../../convex/_generated/dataModel.js";

export async function logTokens(
  userId: Id<"users">,
  tokensUsed: number
): Promise<void> {
  await convex.mutation(api.tokenUsage.log, { userId, tokensUsed });
}
