const numericInput=(value:string)=>value.replace(/[۰-۹]/g,d=>String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[٠-٩]/g,d=>String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/\D/g,'');
export function validateVipRequest(value:Record<string,unknown>){
 for(const key of ['minPrice','maxPrice','minArea','maxArea','minBuildYear','maxBuildYear'])if(/[-−.٫]/.test(String(value[key]||'')))return {ok:false as const,message:'قیمت، متراژ و سال ساخت را به صورت عدد صحیح مثبت وارد کنید.'};
 const firstName=String(value.firstName||'').trim(),lastName=String(value.lastName||'').trim();
 const number=(key:string)=>{const raw=numericInput(String(value[key]||''));return raw?Number(raw):null};
 const minBudget=number('minPrice'),maxBudget=number('maxPrice'),minArea=number('minArea'),maxArea=number('maxArea');
 if(firstName.length<2||lastName.length<2||firstName.length>80||lastName.length>80)return {ok:false as const,message:'نام و نام خانوادگی را کامل وارد کنید.'};
 if(!minBudget&&!maxBudget)return {ok:false as const,message:'حداقل یکی از فیلدهای بودجه را وارد کنید.'};
 for(const [a,b] of [[minBudget,maxBudget],[minArea,maxArea]])if((a!=null&&(!Number.isSafeInteger(a)||a<=0))||(b!=null&&(!Number.isSafeInteger(b)||b<=0))||(a!=null&&b!=null&&a>b))return {ok:false as const,message:'بازه قیمت یا متراژ معتبر نیست؛ مقدار «از» نباید بیشتر از «تا» باشد.'};
 const minYear=number('minBuildYear'),maxYear=number('maxBuildYear');
 if((minYear!=null&&(minYear<1300||minYear>1500))||(maxYear!=null&&(maxYear<1300||maxYear>1500))||(minYear!=null&&maxYear!=null&&minYear>maxYear))return {ok:false as const,message:'بازه سال ساخت معتبر نیست.'};
 const list=(key:string)=>Array.isArray(value[key])?(value[key] as unknown[]).slice(0,100).filter((x):x is string=>typeof x==='string'&&x.length<100):[];
 return {ok:true as const,firstName,lastName,minBudget,maxBudget,minArea,maxArea,minYear,maxYear,regions:list('regions'),neighborhoods:list('neighborhoods'),amenities:list('amenities'),beds:Math.min(20,Math.max(0,Number(value.beds)||0))};
}
export function activeVipSubscription(row:{status:string;startsAt:Date|null;expiresAt:Date|null},now=new Date()){
 return row.status==='active'&&Boolean(row.startsAt&&row.expiresAt&&row.startsAt<=now&&row.expiresAt>now);
}
