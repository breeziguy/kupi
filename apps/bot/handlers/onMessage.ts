import type { Space, Message } from "spectrum-ts";
import { effect, imessage } from "spectrum-ts/providers/imessage";
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

  const phone = message.sender?.id;
  if (!phone) return;
  const user = await getUserByPhone(phone);

  if (!user) {
    await space.send(
      effect(
        `Hey! I'm ${config.wingmanName}, your iMessage wingman 🔥\n\nSign up to get started: ${process.env.WEB_URL ?? "https://kupi.app"}`,
        imessage.effect.message.celebration
      )
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
