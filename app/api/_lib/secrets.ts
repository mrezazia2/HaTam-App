import { env } from "cloudflare:workers";
import {serverSecret} from "../../auth/security";

const encoder=new TextEncoder();
function bytesToBase64(bytes:Uint8Array){let value="";for(const byte of bytes)value+=String.fromCharCode(byte);return btoa(value)}
function base64ToBytes(value:string){const binary=atob(value);return Uint8Array.from(binary,char=>char.charCodeAt(0))}
async function key(){const configured=(env as unknown as Record<string,string>).INTEGRATION_SECRET_KEY;const source=serverSecret("INTEGRATION_SECRET_KEY",configured,process.env.NODE_ENV==="production","hatam-local-development-key-change-before-deploy");const digest=await crypto.subtle.digest("SHA-256",encoder.encode(source));return crypto.subtle.importKey("raw",digest,"AES-GCM",false,["encrypt","decrypt"])}
export async function encryptSecret(value:string){const iv=crypto.getRandomValues(new Uint8Array(12));const encrypted=await crypto.subtle.encrypt({name:"AES-GCM",iv},await key(),encoder.encode(value));return `${bytesToBase64(iv)}.${bytesToBase64(new Uint8Array(encrypted))}`}
export async function decryptSecret(value:string){const [iv,data]=value.split(".");const decrypted=await crypto.subtle.decrypt({name:"AES-GCM",iv:base64ToBytes(iv)},await key(),base64ToBytes(data));return new TextDecoder().decode(decrypted)}
