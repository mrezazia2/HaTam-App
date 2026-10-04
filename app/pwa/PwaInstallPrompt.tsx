"use client";

import {useEffect,useState} from "react";
import {Cross2Icon,DownloadIcon} from "@radix-ui/react-icons";

type InstallEvent=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:"accepted"|"dismissed"}>};

export default function PwaInstallPrompt(){
  const [event,setEvent]=useState<InstallEvent|null>(null),[iosHelp,setIosHelp]=useState(false),[visible,setVisible]=useState(false);
  useEffect(()=>{if("serviceWorker" in navigator)void navigator.serviceWorker.register("/sw.js");const standalone=window.matchMedia("(display-mode: standalone)").matches||(navigator as Navigator&{standalone?:boolean}).standalone;if(standalone||location.pathname.startsWith("/app")||sessionStorage.getItem("hatam-pwa-dismissed"))return;const onPrompt=(value:Event)=>{value.preventDefault();setEvent(value as InstallEvent);setVisible(true)};window.addEventListener("beforeinstallprompt",onPrompt);if(/iphone|ipad|ipod/i.test(navigator.userAgent)){setIosHelp(true);setVisible(true)}return()=>window.removeEventListener("beforeinstallprompt",onPrompt)},[]);
  if(!visible)return null;
  const close=()=>{sessionStorage.setItem("hatam-pwa-dismissed","1");setVisible(false)};
  const install=async()=>{if(!event)return;await event.prompt();const choice=await event.userChoice;if(choice.outcome==="accepted")setVisible(false)};
  return <aside className="pwa-install" dir="rtl" aria-label="نصب وب‌اپ حاتم"><button className="pwa-close" onClick={close} aria-label="بستن"><Cross2Icon/></button><DownloadIcon/><div><strong>وب‌اپ مشتریان حاتم</strong><span>{iosHelp?"از Share، گزینه Add to Home Screen را بزنید؛ برنامه مستقیماً با نسخه مشتری باز می‌شود.":"حاتم را روی صفحه اصلی گوشی نصب کنید؛ اجرای آن مستقیماً وارد وب‌اپ مشتریان می‌شود."}</span></div>{event&&<button className="pwa-action" onClick={install}>افزودن به گوشی</button>}</aside>;
}
