import AdminWorkspace from "./AdminWorkspace";
import { requireRole } from "../auth/server";
import CommunicationsDock from "../communications/CommunicationsDock";

export const dynamic="force-dynamic";
export default async function AdminPage(){await requireRole("admin","/admin");return <><AdminWorkspace/></>}
