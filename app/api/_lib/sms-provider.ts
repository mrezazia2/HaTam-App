import { serviceFetch } from "./service-fetch";

type SmsConfig = Record<string, string | boolean>;
type SmsVariables = Record<string, unknown>;

export type SmsSendResult = {
  ok: boolean;
  status: number;
  providerCode: string | null;
  providerMessage: string | null;
};

export class SmsSendError extends Error {
  status: number;
  providerCode: string | null;
  constructor(result: SmsSendResult) {
    super(result.providerCode ? `SMS_PROVIDER_${result.providerCode}` : `SMS_HTTP_${result.status}`);
    this.status = result.status;
    this.providerCode = result.providerCode;
  }
}

export function isPanelchi(config: SmsConfig, provider = "") {
  return String(config.adapter || "").toLowerCase() === "panelchi" || provider.toLowerCase().includes("panelchi") || provider.includes("پنلچی");
}

export function validateSmsConfig(config: SmsConfig, hasSecret: boolean, provider = "") {
  const required: Array<[string, string]> = [["baseUrl", "آدرس API"], ["sender", "شماره ارسال‌کننده"], ["otpPattern", "پترن ورود"]];
  if (!isPanelchi(config, provider)) required.push(["receptorField", "فیلد گیرنده"], ["templateField", "فیلد پترن"]);
  const missing = required.filter(([key]) => !String(config[key] || "").trim()).map(([, label]) => label);
  if (!hasSecret) missing.push("توکن API");
  return missing;
}

export async function sendSms({ config, provider, token, mobile, pattern, variables }: { config: SmsConfig; provider?: string; token: string; mobile: string; pattern: string; variables: SmsVariables }) {
  const panelchi = isPanelchi(config, provider);
  const headers: Record<string, string> = { "content-type": String(config.contentType || "application/json") };
  const authHeader = String(config.authHeader || "Authorization");
  const authPrefix = String(config.authPrefix ?? "Bearer").trim();
  headers[authHeader] = panelchi ? `Bearer ${token}` : authPrefix ? `${authPrefix} ${token}` : token;
  const body = panelchi ? {
    pattern,
    variables: stringVariables(variables),
    recipient: normalizeIranMobile(mobile, String(config.recipientFormat || "international")),
    sourceNumber: String(config.sender || ""),
  } : genericBody(config, mobile, pattern, variables);
  const response = await serviceFetch(String(config.baseUrl), {
    method: String(config.apiMethod || "POST") === "PUT" ? "PUT" : "POST",
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(Math.min(60_000, Math.max(1_000, Number(config.timeoutMs) || 15_000))),
  });
  const detail = await safeProviderDetail(response);
  return { ok: response.ok, status: response.status, providerCode: detail.code, providerMessage: detail.message } satisfies SmsSendResult;
}

function genericBody(config: SmsConfig, mobile: string, pattern: string, variables: SmsVariables) {
  const payload: Record<string, unknown> = { ...variables };
  payload[String(config.receptorField || "receptor")] = normalizeIranMobile(mobile, String(config.recipientFormat || "local"));
  payload[String(config.senderField || "sender")] = String(config.sender || "");
  payload[String(config.templateField || "template")] = pattern;
  return payload;
}

function stringVariables(variables: SmsVariables) {
  return Object.fromEntries(Object.entries(variables).filter(([, value]) => value !== undefined && value !== null).map(([key, value]) => [key, typeof value === "string" ? value : String(value)]));
}

function normalizeIranMobile(value: string, format: string) {
  const local = value.replace(/\D/g, "").replace(/^0098(?=9)/, "0").replace(/^98(?=9)/, "0");
  if (format === "international" && /^09\d{9}$/.test(local)) return `+98${local.slice(1)}`;
  return local;
}

async function safeProviderDetail(response: Response) {
  try {
    const data = await response.clone().json() as Record<string, unknown>;
    const nested = data.error && typeof data.error === "object" ? data.error as Record<string, unknown> : null;
    const code = data.code ?? data.errorCode ?? nested?.code ?? null;
    const message = data.message ?? data.detail ?? nested?.message ?? null;
    return { code: code === null ? null : String(code), message: message === null ? null : String(message).slice(0, 240) };
  } catch {
    return { code: null, message: null };
  }
}
