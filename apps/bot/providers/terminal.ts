import { terminal } from "spectrum-ts/providers/terminal";

export function getTerminalProvider() {
  return terminal.config();
}
