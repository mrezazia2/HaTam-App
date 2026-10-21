import {env} from "cloudflare:workers";
import {eq} from "drizzle-orm";
import {getDb} from "../../../../db";
import {trustVideos} from "../../../../db/schema";

import {requireAdmin} from '../../_lib/authorization';
import {mediaResponse} from '../../_lib/media-response';
export const dynamic="force-dynamic";
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){const {id}=await params;const row=(await getDb().select().from(trustVideos).where(eq(trustVideos.id,id)).limit(1))[0];if(!row||!row.enabled&&!await requireAdmin(request))return new Response("Not found",{status:404});const bucket=env.MEDIA;if(!bucket)return new Response("Media storage unavailable",{status:503});return mediaResponse(request,bucket,row.objectKey,row.size,row.contentType,row.enabled)}
