import "dotenv/config";
import { createServer } from "http";
import { Spectrum } from "spectrum-ts";
import { config } from "./config.js";
import { getIMessageProvider } from "./providers/imessage.js";
import { getTerminalProvider } from "./providers/terminal.js";
import { onMessage } from "./handlers/onMessage.js";

// Health endpoint — keeps Render free tier alive when pinged by UptimeRobot
const port = process.env.PORT ?? 3000;
createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("ok");
}).listen(port, () => {
  console.log(`Health check listening on port ${port}`);
});

const isLocal = process.env.NODE_ENV === "development";

const app = isLocal
  ? await Spectrum({ providers: [getTerminalProvider()] })
  : await Spectrum({
      projectId: process.env.SPECTRUM_PROJECT_ID!,
      projectSecret: process.env.SPECTRUM_PROJECT_SECRET!,
      providers: [getIMessageProvider()],
    });

console.log(`${isLocal ? "Terminal" : "iMessage"} bot running — ${config.wingmanName} is live`);

console.log("[debug] Waiting for messages...");
const seenMessageIds = new Set<string>();

for await (const [space, message] of app.messages) {
  if (seenMessageIds.has(message.id)) {
    console.log("[debug] Skipping duplicate message:", message.id);
    continue;
  }

  seenMessageIds.add(message.id);
  if (seenMessageIds.size > 2000) {
    const oldestMessageId = seenMessageIds.values().next().value;
    if (oldestMessageId) seenMessageIds.delete(oldestMessageId);
  }

  console.log("[debug] Message received from:", message.sender?.id, "type:", message.content.type);
  onMessage(space, message).catch(err => {
    console.error("Error handling message:", err);
  });
}
