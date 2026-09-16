"use client";

import { useEffect, useState } from "react";
import { CardStackIcon } from "@radix-ui/react-icons";
import type { PortalKind } from "./PortalExperience";

type Data = {
  wallet: { id: string; balance: number; currency: string };
  transactions: Array<{ id: string; type: string; amount: number; status: string; description: string; createdAt: string }>;
  receipts: Array<{ id: string; amount: number; trackingCode: string; status: string }>;
  settlements: Array<{ id: string; amount: number; iban: string; status: string }>;
};

const money = (value: number) => `${value.toLocaleString("fa-IR")} تومان`;

export default function WalletView({ kind, notify }: { kind: PortalKind; notify: (text: string) => void }) {
  const [data, setData] = useState<Data | null>(null);
  const [mode, setMode] = useState<"online" | "card-transfer" | "settlement" | null>(null);
  const [amount, setAmount] = useState("");
  const [detail, setDetail] = useState("");
  const [busy, setBusy] = useState(false);
  const headers = { "x-hatam-preview-role": kind };
  const load = () => fetch("/api/wallet", { headers }).then(r => r.ok ? r.json() : Promise.reject()).then(setData).catch(() => notify("دریافت کیف پول انجام نشد."));

  useEffect(load, [kind]);

  const submit = async () => {
    if (!mode) return;
    const numericAmount = Number(amount);
    if (!Number.isSafeInteger(numericAmount) || numericAmount <= 0) {
      notify("مبلغ را به تومان و به‌صورت عدد صحیح وارد کنید.");
      return;
    }
    setBusy(true);
    const body = mode === "card-transfer"
      ? { action: mode, amount: numericAmount, trackingCode: detail }
      : mode === "settlement"
        ? { action: mode, amount: numericAmount, iban: detail }
        : { action: mode, amount: numericAmount };
    try {
      const response = await fetch("/api/wallet", { method: "POST", headers: { ...headers, "content-type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      if (mode === "online") {
        const start = await fetch("/api/payments/start", { method: "POST", headers: { ...headers, "content-type": "application/json" }, body: JSON.stringify({ intentId: result.id }) });
        const payment = await start.json();
        if (!start.ok || !payment.redirectUrl) throw new Error(payment.error || "GATEWAY_REQUEST_FAILED");
        location.href = payment.redirectUrl;
        return;
      }
      notify(mode === "card-transfer" ? "رسید برای بررسی ادمین ثبت شد." : "درخواست تسویه ثبت و مبلغ آن از موجودی قابل استفاده رزرو شد.");
      setMode(null); setAmount(""); setDetail(""); load();
    } catch (error) {
      const key = error instanceof Error ? error.message : "";
      notify(key === "PAYMENT_GATEWAY_NOT_CONFIGURED" ? "درگاه آنلاین هنوز در ادمین فعال نشده است." : key === "INSUFFICIENT_BALANCE" ? "موجودی کیف پول کافی نیست." : "ثبت عملیات مالی انجام نشد.");
    } finally { setBusy(false); }
  };

  if (!data) return <section className="portal-wallet"><div className="portal-empty">در حال دریافت کیف پول...</div></section>;
  return <section className="portal-wallet">
    <article className="wallet-balance"><div><span>موجودی قابل استفاده</span><strong>{money(data.wallet.balance)}</strong><p>شماره کیف پول: {data.wallet.id}</p></div><CardStackIcon/><div><button onClick={() => setMode("online")}>افزایش موجودی آنلاین</button><button onClick={() => setMode("card-transfer")}>ثبت کارت‌به‌کارت</button>{kind !== "user" && <button onClick={() => setMode("settlement")}>درخواست تسویه</button>}</div></article>
    {mode && <div className="wallet-operation"><strong>{mode === "online" ? "پرداخت آنلاین" : mode === "card-transfer" ? "ثبت رسید کارت‌به‌کارت" : "درخواست تسویه"}</strong><input aria-label="مبلغ به تومان" inputMode="numeric" value={amount} onChange={e => setAmount(e.target.value.replace(/\D/g, ""))} placeholder="مبلغ به تومان"/>{mode === "card-transfer" && <input value={detail} onChange={e => setDetail(e.target.value)} placeholder="کد پیگیری بانکی"/>}{mode === "settlement" && <input dir="ltr" value={detail} onChange={e => setDetail(e.target.value.toUpperCase())} placeholder="IR000000000000000000000000"/>}<button disabled={busy} onClick={submit}>{busy ? "در حال اتصال..." : "تأیید عملیات"}</button><button onClick={() => setMode(null)}>انصراف</button></div>}
    <div className="wallet-grid"><article className="portal-card"><div className="portal-card-head"><div><span>گردش مالی واقعی</span><h2>تراکنش‌های اخیر</h2></div></div><div className="wallet-transactions">{data.transactions.map(item => <button key={item.id}><span><strong>{item.description}</strong><small>{new Date(item.createdAt).toLocaleString("fa-IR")} · {item.status}</small></span><b className={item.type === "credit" || item.type === "release" ? "credit" : "debit"}>{item.type === "hold" ? "رزرو " : item.type === "credit" || item.type === "release" ? "+" : "−"}{money(item.amount)}</b></button>)}{!data.transactions.length && <div className="portal-empty">هنوز تراکنشی ثبت نشده است.</div>}</div></article><article className="portal-card wallet-account"><span>عملیات در انتظار</span><h2>{(data.receipts.length + data.settlements.length).toLocaleString("fa-IR")} درخواست</h2>{data.receipts.slice(0, 3).map(x => <p key={x.id}>رسید {x.trackingCode} · {x.status}</p>)}{data.settlements.slice(0, 3).map(x => <p key={x.id}>تسویه {money(x.amount)} · {x.status}</p>)}</article></div>
  </section>;
}
