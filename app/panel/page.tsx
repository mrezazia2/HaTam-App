import PortalExperience from "../portals/PortalExperience";
import LogoutButton from "../auth/LogoutButton";
import { requireRole } from "../auth/server";
import CommunicationsDock from "../communications/CommunicationsDock";

export const dynamic="force-dynamic";
export default async function UserPanel() {
  const account=await requireRole("user","/panel");return <><PortalExperience kind="user" accountName={account.name||"کاربر"} /><CommunicationsDock role="user"/><LogoutButton/></>;
}
