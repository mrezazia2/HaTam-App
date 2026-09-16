import ContentRenderer from "./ContentRenderer";
import ContactPage from "../../contact/ContactPage";
export default async function PublishedContentPage({params}:{params:Promise<{slug:string}>}){const {slug}=await params;return slug==="contact"?<ContactPage/>:<ContentRenderer slug={slug}/>}
