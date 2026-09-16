/** Monetary values inside HataM are integer toman values. */
export function toGatewayAmount(amountInToman: number, gatewayUnit: string) {
  if (!Number.isSafeInteger(amountInToman) || amountInToman <= 0) throw new Error("INVALID_AMOUNT");
  return gatewayUnit === "rial" ? amountInToman * 10 : amountInToman;
}
