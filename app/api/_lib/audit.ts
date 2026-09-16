import type { getDb } from "../../../db";
import { auditLogs } from "../../../db/schema";

type Db=ReturnType<typeof getDb>;
export async function writeAudit(db:Db,actor:{id:string;role:string},action:string,entityType:string,entityId:string|null,summary:string,metadata:Record<string,unknown>={}){await db.insert(auditLogs).values({id:`AUD-${crypto.randomUUID()}`,actorAccountId:actor.id,actorRole:actor.role,action,entityType,entityId,summary,metadata,createdAt:new Date()})}
