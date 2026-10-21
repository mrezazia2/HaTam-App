import PortalExperience from "../portals/PortalExperience";
import LogoutButton from "../auth/LogoutButton";
import { requireRole } from "../auth/server";
import CommunicationsDock from "../communications/CommunicationsDock";

export const dynamic="force-dynamic";
export default async function ConsultantPanel() { const account=await requireRole("consultant","/consultant");return <><PortalExperience kind="consultant" accountName={account.name||"مشاور"} /><CommunicationsDock role="consultant" surface="consultant"/><LogoutButton/></>; }
