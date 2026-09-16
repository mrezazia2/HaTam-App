import AuthExperience, { type AuthRole } from "../../auth/AuthExperience";
const validRoles:AuthRole[]=["user","consultant","agency"];
export default async function RoleLoginPage({params}:{params:Promise<{role:string}>}){const {role}=await params;return <AuthExperience mode="login" role={validRoles.includes(role as AuthRole)?role as AuthRole:"user"}/>}
