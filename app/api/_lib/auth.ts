import { env } from "cloudflare:workers";

const encoder=new TextEncoder();

export function normalizeMobile(value:string){const digits=value.replace(/\D/g,"");if(/^989\d{9}$/.test(digits))return `0${digits.slice(2)}`;if(/^9\d{9}$/.test(digits))return `0${digits}`;return /^09\d{9}$/.test(digits)?digits:null}
export async function hashValue(value:string){const configured=(env as unknown as Record<string,string>).AUTH_SECRET;const pepper=configured||"hatam-local-auth-key-change-before-deploy";const digest=await crypto.subtle.digest("SHA-256",encoder.encode(`${pepper}:${value}`));return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,"0")).join("")}
export function isLocalRequest(request:Request){const host=new URL(request.url).hostname;return host==="127.0.0.1"||host==="localhost"}
export function sessionCookie(token:string,secure=true,maxAge=60*60*24*30){return `hatam_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure?"; Secure":""}`}
export async function passwordHash(password:string,salt=crypto.randomUUID()){const material=await crypto.subtle.importKey("raw",encoder.encode(password),"PBKDF2",false,["deriveBits"]),bits=await crypto.subtle.deriveBits({name:"PBKDF2",hash:"SHA-256",salt:encoder.encode(salt),iterations:210000},material,256),hash=[...new Uint8Array(bits)].map(x=>x.toString(16).padStart(2,"0")).join("");return `${salt}:${hash}`}
export async function verifyPassword(password:string,stored:string){const [salt]=stored.split(":");if(!salt)return false;const calculated=await passwordHash(password,salt);if(calculated.length!==stored.length)return false;let diff=0;for(let i=0;i<stored.length;i++)diff|=stored.charCodeAt(i)^calculated.charCodeAt(i);return diff===0}
