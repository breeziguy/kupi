import { imessage } from "spectrum-ts/providers/imessage";

export function getIMessageProvider() {
  return imessage.config();
}

export { imessage };
