"use client";
import SiteShell from '../site/SiteShell';
import {UrgentSaleScreen} from '../Prototype';
import {KeyboardProvider} from '../mobile/Keyboard';
import {MobileDeviceProvider} from '../mobile/Device';
export default function Page(){return <SiteShell title="فروش فوری ملک" description="مشخصات ملک خود را برای پیگیری کارشناسان ثبت کنید."><div className="site-urgent-form"><MobileDeviceProvider><KeyboardProvider><UrgentSaleScreen onBack={()=>history.length>1?history.back():location.assign('/')} onDone={()=>location.assign('/')}/></KeyboardProvider></MobileDeviceProvider></div><style>{`.site-urgent-form .filter-logo-row{display:none}.site-urgent-form .urgent-scroll{height:auto;max-height:none;overflow:visible}.site-urgent-form .urgent-page{max-width:760px;margin:auto;padding-bottom:32px}`}</style></SiteShell>}
