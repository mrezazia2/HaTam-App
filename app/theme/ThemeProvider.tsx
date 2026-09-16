"use client";
import { createContext,useContext,useEffect,useMemo,useState } from "react";
import { MoonIcon,SunIcon } from "@radix-ui/react-icons";
export type ThemeMode="light"|"dark";
type ThemeContextValue={theme:ThemeMode;setTheme:(value:ThemeMode)=>void;toggleTheme:()=>void};
const ThemeContext=createContext<ThemeContextValue|null>(null),storageKey="hatam-color-theme-v1";
export function ThemeProvider({children}:{children:React.ReactNode}){
 const [theme,setThemeState]=useState<ThemeMode>("light"),[ready,setReady]=useState(false);
 useEffect(()=>{const stored=localStorage.getItem(storageKey) as ThemeMode|null,next=stored==="dark"||stored==="light"?stored:window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";setThemeState(next);document.documentElement.dataset.theme=next;document.documentElement.style.colorScheme=next;setReady(true)},[]);
 useEffect(()=>{
  const selector="h1,h2,h3,h4,h5,h6,p,span,strong,small,label,time,em,b,a";
  const syncGoldText=()=>{const dark=document.documentElement.dataset.theme==="dark";document.querySelectorAll<HTMLElement>(selector).forEach(element=>{if(!dark){delete element.dataset.goldGradient;return}if(element.dataset.goldGradient==="true")return;const color=getComputedStyle(element).color.match(/\d+(?:\.\d+)?/g)?.slice(0,3).map(Number);if(!color)return;const [red,green,blue]=color,isGold=red>=155&&green>=105&&green<=220&&blue<=145&&red>green&&green>blue;if(isGold)element.dataset.goldGradient="true"})};
  const frame=requestAnimationFrame(syncGoldText),observer=new MutationObserver(()=>requestAnimationFrame(syncGoldText));observer.observe(document.body,{childList:true,subtree:true});window.addEventListener("hatam-theme-change",syncGoldText);return()=>{cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener("hatam-theme-change",syncGoldText)}
 },[]);
 const setTheme=(value:ThemeMode)=>{setThemeState(value);localStorage.setItem(storageKey,value);document.documentElement.dataset.theme=value;document.documentElement.style.colorScheme=value;window.dispatchEvent(new CustomEvent("hatam-theme-change",{detail:value}))};
 const value=useMemo(()=>({theme,setTheme,toggleTheme:()=>setTheme(theme==="dark"?"light":"dark")}),[theme]);
 return <ThemeContext.Provider value={value}>{children}<button className="global-theme-toggle" onClick={value.toggleTheme} aria-label={theme==="dark"?"فعال‌کردن حالت روشن":"فعال‌کردن حالت تیره"} title={theme==="dark"?"حالت روشن":"حالت تیره"}>{ready&&theme==="dark"?<SunIcon/>:<MoonIcon/>}<span>{theme==="dark"?"روشن":"تیره"}</span></button></ThemeContext.Provider>
}
export function useTheme(){const value=useContext(ThemeContext);if(!value)throw new Error("useTheme must be used inside ThemeProvider");return value}
