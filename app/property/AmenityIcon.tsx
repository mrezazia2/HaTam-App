export default function AmenityIcon({name}:{name:string}){
 const paths:Record<string,React.ReactNode>={
 'پارکینگ':<><path d="m4 10 2-5h12l2 5v9h-3v-3H7v3H4zM4 11h16M7 13h1m8 0h1"/></>,
 'پارکینگ موتور':<><circle cx="5" cy="16" r="3"/><circle cx="19" cy="16" r="3"/><path d="m5 16 5-7 5 7H5m8-10h3l3 10M8 9h4"/></>,
 'آسانسور':<><path d="M4 3h16v18H4zM12 3v18m-5-9 2-3 2 3m2 3 2 3 2-3"/></>,
 'انباری':<><path d="M4 3h16v18H4zM4 9h16M4 15h16M10 6h4m-4 6h4m-4 6h4"/></>,
 'بالکن':<><path d="M3 12h18M4 12v8m4-8v8m4-8v8m4-8v8m4-8v8M3 20h18M7 10V3h10v7"/></>,
 'حیاط':<><path d="M12 21v-8m0 3-4-4m4 2 4-4"/><circle cx="12" cy="8" r="6"/><path d="M3 21h18"/></>,
 };
 return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]||<path d="m5 12 4 4L19 6"/>}</svg>
}
