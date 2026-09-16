import PortalExperience from "../portals/PortalExperience";
import LogoutButton from "../auth/LogoutButton";
import { requireRole } from "../auth/server";
import CommunicationsDock from "../communications/CommunicationsDock";

export const dynamic="force-dynamic";
export default async function AgencyPanel() { await requireRole("agency","/agency");return <><PortalExperience kind="agency" /><CommunicationsDock role="agency"/><LogoutButton/></>; }
