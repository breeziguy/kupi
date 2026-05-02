import { ConvexHttpClient } from "convex/browser";

if (!process.env.CONVEX_URL) {
  throw new Error("CONVEX_URL is not set");
}

export const convex = new ConvexHttpClient(process.env.CONVEX_URL);
