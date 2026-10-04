// Development fallbacks must never become production credentials.
export function serverSecret(name: string, configured: string | undefined, production: boolean, fallback: string) {
  if (configured && configured.length >= 32) return configured;
  if (production) throw new Error(`SERVER_SECRET_REQUIRED_${name}`);
  if (configured) throw new Error(`SERVER_SECRET_TOO_SHORT_${name}`);
  return fallback;
}

export function sessionToken(cookie: string) {
  const value = cookie.split(";").map(x => x.trim()).find(x => x.startsWith("hatam_session="))?.slice(14);
  if (!value || value.length > 1024) return null;
  try { return decodeURIComponent(value); } catch { return null; }
}

// Cookie-authenticated writes must not accept another website as their origin.
// Non-browser clients without Origin remain subject to normal authentication.
export function trustedMutation(request: Request) {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return true;
  if (request.headers.get("sec-fetch-site") === "cross-site") return false;
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try { return new URL(origin).origin === new URL(request.url).origin; }
  catch { return false; }
}
