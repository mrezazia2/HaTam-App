import test from "node:test";
import assert from "node:assert/strict";
import { toGatewayAmount } from "../app/api/_lib/money.ts";

test("keeps toman amounts unchanged for toman gateways", () => {
  assert.equal(toGatewayAmount(1_250_000, "toman"), 1_250_000);
});

test("converts toman to rial only at the gateway boundary", () => {
  assert.equal(toGatewayAmount(1_250_000, "rial"), 12_500_000);
});

test("rejects non-positive and fractional internal amounts", () => {
  assert.throws(() => toGatewayAmount(0, "toman"), /INVALID_AMOUNT/);
  assert.throws(() => toGatewayAmount(10.5, "rial"), /INVALID_AMOUNT/);
});
