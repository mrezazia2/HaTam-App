"use client";
import "./home-advanced-filters.css";

const ascii = value => String(value).replace(/[۰-۹]/g, digit => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit))).replace(/[٠-٩]/g, digit => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit))).replace(/\D/g, "");
const display = (value, grouped = false) => value ? Number(value).toLocaleString("fa-IR", {useGrouping: grouped}) : "";
const amenities = ["آسانسور", "بالکن", "حیاط", "پارکینگ", "انباری", "پارک موتور"];

export default function HomeAdvancedFilters({filters, setFilter, resetFilters, onShowResults}) {
 const range = (title, from, to, year = false, grouped = false) => <fieldset className="home-filter-field"><legend>{title}</legend><div className="home-filter-range">
  <input aria-label={title+" از"} inputMode="numeric" value={display(filters[from],grouped)} placeholder={year?"از ۱۳...":"از"} onChange={event=>setFilter(from,ascii(event.target.value).slice(0,year?4:16))}/>
  <span aria-hidden="true">تا</span>
  <input aria-label={title+" تا"} inputMode="numeric" value={display(filters[to],grouped)} placeholder={year?"تا ۱۳...":"تا"} onChange={event=>setFilter(to,ascii(event.target.value).slice(0,year?4:16))}/>
 </div></fieldset>;
 const stepper = (title,key) => <fieldset className="home-filter-field"><legend>{title}</legend><div className="home-filter-stepper">
  <button type="button" aria-label={"افزایش "+title} onClick={()=>setFilter(key,String(Math.min(9999,Number(filters[key]||0)+1)))}>+</button>
  <input aria-label={title} inputMode="numeric" value={display(filters[key])||"۰"} onChange={event=>setFilter(key,ascii(event.target.value).slice(0,4))}/>
  <button type="button" aria-label={"کاهش "+title} onClick={()=>setFilter(key,String(Math.max(0,Number(filters[key]||0)-1)))}>−</button>
 </div></fieldset>;
 return <section className="advanced-filter home-advanced-filter" aria-label="فیلترهای بیشتر" dir="rtl">
  <div className="home-filter-grid">
   {range("قیمت (تومان)","minPrice","maxPrice",false,true)}
   {range("متراژ (متر)","minSize","maxSize")}
   {range("سال ساخت","minYear","maxYear",true)}
   {stepper("حداقل تعداد خواب","beds")}
   {stepper("کل طبقات ساختمان","floors")}
   {stepper("واحد در طبقه","units")}
  </div>
  <fieldset className="home-filter-amenities"><legend>امکانات</legend><div>{amenities.map(item=><button key={item} type="button" role="switch" aria-checked={filters.amenities?.includes(item)||false} onClick={()=>setFilter("amenities",filters.amenities?.includes(item)?filters.amenities.filter(value=>value!==item):[...(filters.amenities||[]),item])}>{item}</button>)}</div></fieldset>
  <footer className="home-filter-actions"><button className="home-filter-clear" type="button" onClick={resetFilters}>پاک کردن فیلترها</button><button className="home-filter-submit" type="button" onClick={onShowResults}>نمایش نتایج</button></footer>
 </section>;
}
