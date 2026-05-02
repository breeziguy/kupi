import "dotenv/config";
import { Spectrum } from "spectrum-ts";
import { config } from "./config.js";
import { getIMessageProvider } from "./providers/imessage.js";
import { getTerminalProvider } from "./providers/terminal.js";
import { onMessage } from "./handlers/onMessage.js";

const isLocal = process.env.NODE_ENV === "development";

const spectrumConfig = isLocal
  ? { providers: [getTerminalProvider()] }
  : {
      projectId: process.env.SPECTRUM_PROJECT_ID!,
      projectSecret: process.env.SPECTRUM_PROJECT_SECRET!,
      providers: [getIMessageProvider()],
    };

const app = await Spectrum(spectrumConfig);

console.log(`${isLocal ? "Terminal" : "iMessage"} bot running — ${config.wingmanName} is live`);

for await (const [space, message] of app.messages) {
  onMessage(space, message).catch(err => {
    console.error("Error handling message:", err);
  });
}
