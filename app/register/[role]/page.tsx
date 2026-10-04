import AuthExperience, { type AuthRole } from "../../auth/AuthExperience";
import PublicSiteHeader from "../../site/PublicSiteHeader";
const validRoles:AuthRole[]=["user","consultant","agency"];
export default async function RoleRegisterPage({params}:{params:Promise<{role:string}>}){const {role}=await params;return <><PublicSiteHeader/><AuthExperience mode="register" role={validRoles.includes(role as AuthRole)?role as AuthRole:"user"}/></>}
