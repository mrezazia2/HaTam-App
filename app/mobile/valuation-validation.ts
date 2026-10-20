const mobileDigits=(value:string)=>value.replace(/[۰-۹]/g,x=>String(x.charCodeAt(0)-1776)).replace(/[٠-٩]/g,x=>String(x.charCodeAt(0)-1632)).replace(/\D/g,'');
export type ValuationInput={name:string;mobile:string;address:string;area:string;year:string;bedrooms:number;floor:number;units:number;price:string;amenities:string[]};
export function validateValuation(input:ValuationInput){
 const errors:Record<string,string>={};
 if(input.name.trim().split(/\s+/).length<2||input.name.length>120)errors.name='نام و نام خانوادگی را کامل وارد کنید.';
 if(!/^09\d{9}$/.test(mobileDigits(input.mobile)))errors.mobile='شماره موبایل معتبر وارد کنید.';
 if(input.address.trim().length<8||input.address.length>600)errors.address='آدرس کامل ملک را بنویسید.';
 if(!Number.isSafeInteger(Number(input.area))||Number(input.area)<20||Number(input.area)>100000)errors.area='متراژ معتبر وارد کنید.';
 if(!/^\d{4}$/.test(input.year)||Number(input.year)<1300||Number(input.year)>1405)errors.year='سال ساخت را بین ۱۳۰۰ تا ۱۴۰۵ وارد کنید.';
 for(const [key,min,max] of [['bedrooms',0,50],['floor',0,200],['units',1,1000]] as const)if(!Number.isSafeInteger(input[key])||input[key]<min||input[key]>max)errors[key]='تعداد واردشده معتبر نیست.';
 if(input.price&&(!Number.isSafeInteger(Number(input.price))||Number(input.price)<1000000||Number(input.price)>1e15))errors.price='قیمت را به تومان و به صورت معتبر بنویسید.';
 if(!Array.isArray(input.amenities)||input.amenities.length>30||input.amenities.some(x=>typeof x!=='string'||x.length>60))errors.amenities='امکانات معتبر نیست.';
 return errors;
}
export function valuationNotes(input:ValuationInput){return `نام مالک: ${input.name}\nموبایل: ${input.mobile}\nآدرس: ${input.address}\nمتراژ: ${input.area}\nسال ساخت: ${input.year}\nخواب: ${input.bedrooms}\nطبقه: ${input.floor}\nواحد در طبقه: ${input.units}\nامکانات: ${input.amenities.join('، ')}\nقیمت مدنظر (تومان): ${input.price||'اعلام نشده'}`;}
