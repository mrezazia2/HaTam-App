import { env } from "cloudflare:workers";

// Enable only on the owner-private Sites presentation deployment.
export function presentationMode() {
  return (env as unknown as Record<string, unknown>).HATAM_PRESENTATION_MODE === "owner-private-readonly";
}
