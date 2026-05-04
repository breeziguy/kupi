import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import type { Space } from "spectrum-ts";
import { contact } from "spectrum-ts";
import { config } from "../config.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function kupiPhone(): string | undefined {
  return process.env.KUPI_PHONE || process.env.NEXT_PUBLIC_PHOTON_IMESSAGE_PHONE || undefined;
}

function kupiPhoto() {
  try {
    const buf = readFileSync(join(__dirname, "../assets/profile.png"));
    return { mimeType: "image/png", read: async () => buf };
  } catch {
    return undefined;
  }
}

export async function sendKupiContact(space: Space): Promise<void> {
  const phone = kupiPhone();
  const photo = kupiPhoto();

  const card = contact({
    name: { formatted: config.wingmanName, first: config.wingmanName },
    ...(phone ? { phones: [{ value: phone, type: "mobile" as const }] } : {}),
    org: { name: "KUPI AI", title: "Your iMessage Wingman" },
    note: "Text me anything about your dating life. Send a screenshot and I'll read the room.",
    ...(photo ? { photo } : {}),
  });

  await space.send(card);
}
