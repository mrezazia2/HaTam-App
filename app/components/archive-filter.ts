export type ArchiveFilterValue={status:string;from:string;to:string};
export const archiveStatusLabels:Record<string,string>={active:'فعال',suspended:'تعلیق',invited:'دعوت‌شده',draft:'پیش‌نویس',pending:'در انتظار بررسی',published:'منتشرشده',vip:'اختصاصی VIP',archived:'بایگانی',rejected:'ردشده',new:'جدید',assigned:'ارجاع‌شده',reviewing:'در بررسی',review:'در بررسی',contacted:'تماس گرفته‌شده',qualified:'واجد شرایط',won:'موفق',lost:'از دست رفته',matched:'ملک پیشنهادشده',closed:'بسته‌شده',requested:'درخواست‌شده',confirmed:'تأییدشده',scheduled:'زمان‌بندی‌شده',signing:'در حال امضا',completed:'تکمیل‌شده',cancelled:'لغوشده'};
export function matchesArchiveFilter(item:{status?:string;createdAt?:string|number|Date|null},filter:ArchiveFilterValue){
 if(filter.status&&item.status!==filter.status)return false;
 if(!filter.from&&!filter.to)return true;
 if(!item.createdAt)return false;
 const value=typeof item.createdAt==='number'&&item.createdAt<1e12?item.createdAt*1000:item.createdAt;
 const time=new Date(value).getTime();if(!Number.isFinite(time))return false;
 const start=filter.from?Date.parse(`${filter.from}T00:00:00+03:30`):-Infinity;
 const end=filter.to?Date.parse(`${filter.to}T23:59:59.999+03:30`):Infinity;
 return time>=start&&time<=end;
}
