import ConsultantProfile from '../ConsultantProfile';
import SiteShell from '../../site/SiteShell';
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <SiteShell eyebrow="تیم حاتم" title="معرفی مشاور" description="اطلاعات تماس و املاک منتشرشده مشاور"><ConsultantProfile id={id} inApp={false}/></SiteShell>}
