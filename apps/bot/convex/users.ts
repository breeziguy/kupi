import { convex } from "./client.js";
import { api } from "../../../convex/_generated/api.js";

export async function getUserByPhone(phone: string) {
  return await convex.query(api.users.getByPhone, { phone });
}
