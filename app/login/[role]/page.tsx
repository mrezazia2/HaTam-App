import AuthExperience, { type AuthRole } from "../../auth/AuthExperience";
import PublicSiteHeader from "../../site/PublicSiteHeader";
const validRoles:AuthRole[]=["user","consultant","agency","admin"];
export default async function RoleLoginPage({params}:{params:Promise<{role:string}>}){const {role}=await params;return <><PublicSiteHeader/><AuthExperience mode="login" role={validRoles.includes(role as AuthRole)?role as AuthRole:"user"}/></>}
