// Never trust a localhost Host header to bypass authentication in production.
export function localPreviewHost(host: string) {
  return process.env.NODE_ENV !== "production" && (host === "localhost" || host === "127.0.0.1");
}
