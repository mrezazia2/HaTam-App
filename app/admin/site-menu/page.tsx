import {requireRole} from "../../auth/server";
import SiteMenuAdmin from "./SiteMenuAdmin";
export default async function Page(){await requireRole("admin","/admin/site-menu");return <main className="trust-admin-page"><h1>منوی مستقل سایت</h1><p>این منو مستقل از اپ است. ترتیب ردیف‌ها ترتیب نمایش است.</p><SiteMenuAdmin/></main>}
