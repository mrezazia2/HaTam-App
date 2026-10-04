import {localPreviewHost} from "../../auth/local-preview";
import {serverSecret} from "../../auth/security";
import {normalizeMobile} from "../../auth/digits";
import { env } from "cloudflare:workers";

const encoder=new TextEncoder();

export {normalizeMobile};
export async function hashValue(value:string){const configured=(env as unknown as Record<string,string>).AUTH_SECRET;const pepper=serverSecret("AUTH_SECRET",configured,process.env.NODE_ENV==="production","hatam-local-auth-key-change-before-deploy");const digest=await crypto.subtle.digest("SHA-256",encoder.encode(`${pepper}:${value}`));return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,"0")).join("")}
export function isLocalRequest(request:Request){const host=new URL(request.url).hostname;return localPreviewHost(host)}
export function sessionCookie(token:string,secure=true,maxAge=60*60*24*30){return `hatam_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure?"; Secure":""}`}
export async function passwordHash(password:string,salt=crypto.randomUUID()){const material=await crypto.subtle.importKey("raw",encoder.encode(password),"PBKDF2",false,["deriveBits"]),bits=await crypto.subtle.deriveBits({name:"PBKDF2",hash:"SHA-256",salt:encoder.encode(salt),iterations:210000},material,256),hash=[...new Uint8Array(bits)].map(x=>x.toString(16).padStart(2,"0")).join("");return `${salt}:${hash}`}
export async function verifyPassword(password:string,stored:string){const [salt]=stored.split(":");if(!salt)return false;const calculated=await passwordHash(password,salt);if(calculated.length!==stored.length)return false;let diff=0;for(let i=0;i<stored.length;i++)diff|=stored.charCodeAt(i)^calculated.charCodeAt(i);return diff===0}
