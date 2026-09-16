import PortalExperience from "../portals/PortalExperience";
import LogoutButton from "../auth/LogoutButton";
import { requireRole } from "../auth/server";
import CommunicationsDock from "../communications/CommunicationsDock";

export const dynamic="force-dynamic";
export default async function ConsultantPanel() { await requireRole("consultant","/consultant");return <><PortalExperience kind="consultant" /><CommunicationsDock role="consultant"/><LogoutButton/></>; }
