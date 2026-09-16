import {asc,eq} from "drizzle-orm";
import {getDb} from "../../../db";
import {trustVideos} from "../../../db/schema";

export const dynamic="force-dynamic";
export async function GET(){const rows=await getDb().select().from(trustVideos).where(eq(trustVideos.enabled,true)).orderBy(asc(trustVideos.sortOrder));return Response.json({ok:true,items:rows.map(row=>({id:row.id,title:row.title,url:`/api/trust-videos/${row.id}`}))})}
