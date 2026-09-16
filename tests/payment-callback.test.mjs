import assert from "node:assert/strict";
import test from "node:test";
import { gatewayCallbackUrl, paymentResultForStatus, sanitizePaymentCallback } from "../app/api/_lib/payment-callback.ts";

test("gateway returns through verification, including legacy configuration", () => {
  assert.equal(gatewayCallbackUrl("https://app.example.com").pathname, "/api/payments/callback");
  assert.equal(gatewayCallbackUrl("https://app.example.com", "https://example.com/payment/callback").href, "https://example.com/api/payments/callback");
  assert.equal(gatewayCallbackUrl("https://app.example.com", "https://example.com/custom").pathname, "/custom");
});

test("payment status maps terminal callbacks consistently", () => {
  assert.equal(paymentResultForStatus("paid"), "success");
  assert.equal(paymentResultForStatus("cancelled"), "cancelled");
  assert.equal(paymentResultForStatus("failed"), "failed");
});

test("callback persistence redacts secrets and limits untrusted values", () => {
  const sanitized = sanitizePaymentCallback({ Authority: "A-1", api_key: "private", note: "x".repeat(600) });
  assert.equal(sanitized.Authority, "A-1");
  assert.equal(sanitized.api_key, "[REDACTED]");
  assert.equal(sanitized.note.length, 500);
});
