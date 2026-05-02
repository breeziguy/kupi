import type { Space, Message } from "spectrum-ts";
import { getUserByPhone } from "../convex/users.js";
import { checkBilling } from "./billing.js";
import { handleScreenshot } from "./screenshot.js";
import { handleCommand } from "./commands.js";
import { config } from "../config.js";

export async function onMessage(space: Space, message: Message): Promise<void> {
  if (
    message.content.type !== "text" &&
    message.content.type !== "attachment"
  ) {
    return;
  }

  const phone = message.sender.id;
  const user = await getUserByPhone(phone);

  if (!user) {
    await space.send(
      `Hey! I'm ${config.wingmanName}, your iMessage wingman 🔥\n\n` +
        `Sign up to get started: ${process.env.WEB_URL ?? "https://kupi.app"}`
    );
    return;
  }

  const billingOk = await checkBilling(space, user);
  if (!billingOk) return;

  if (message.content.type === "attachment") {
    await handleScreenshot(space, message, user);
    return;
  }

  await handleCommand(space, message, user);
}
