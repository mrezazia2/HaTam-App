import {env} from "cloudflare:workers";
import {eq} from "drizzle-orm";
import {getDb} from "../../../../db";
import {trustVideos} from "../../../../db/schema";

export const dynamic="force-dynamic";
export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){const {id}=await params;const row=(await getDb().select().from(trustVideos).where(eq(trustVideos.id,id)).limit(1))[0];if(!row||!row.enabled)return new Response("Not found",{status:404});const bucket=env.MEDIA;if(!bucket)return new Response("Media storage unavailable",{status:503});const object=await bucket.get(row.objectKey);if(!object)return new Response("Not found",{status:404});return new Response(object.body,{headers:{"content-type":row.contentType,"content-length":String(row.size),"cache-control":"public, max-age=3600","accept-ranges":"bytes"}})}
