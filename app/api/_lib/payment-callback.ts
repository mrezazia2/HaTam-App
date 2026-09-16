const SENSITIVE_KEY = /(token|secret|password|merchant|api[-_]?key|authorization)/i;

export function gatewayCallbackUrl(origin: string, configured?: string) {
  const url = new URL(configured || "/api/payments/callback", origin);
  // Migrate the former display-only callback address without losing its host.
  if (url.pathname.replace(/\/$/, "") === "/payment/callback") url.pathname = "/api/payments/callback";
  return url;
}

export function sanitizePaymentCallback(
  input: Record<string, string>,
  limits: { maxEntries?: number; maxKeyLength?: number; maxValueLength?: number } = {},
) {
  const maxEntries = limits.maxEntries ?? 24;
  const maxKeyLength = limits.maxKeyLength ?? 80;
  const maxValueLength = limits.maxValueLength ?? 500;

  return Object.fromEntries(
    Object.entries(input)
      .slice(0, maxEntries)
      .map(([key, value]) => {
        const safeKey = key.slice(0, maxKeyLength);
        return [safeKey, SENSITIVE_KEY.test(safeKey) ? "[REDACTED]" : value.slice(0, maxValueLength)];
      }),
  );
}

export function paymentResultForStatus(status?: string | null) {
  if (status === "paid") return "success";
  if (status === "cancelled") return "cancelled";
  return "failed";
}
