// Names/IDs retrieved from Divar's public Tehran district picker, 2026-10-18.
// Divar supplies neighborhoods, not municipal region membership; grouping is local.
export const neighborhoodCatalogVersion=2;
export const tehranNeighborhoods=[
 {id:'12',name:'منطقه ۱۲',neighborhoods:['آبشار','امین حضور','ایران','بازار','بهارستان','پامنار','پارک شهر','حسن‌آباد','دروازه شمیران','سنگلج (شاپور)','سیروس','فردوسی','قیام','کوثر','لاله زار','مولوی','هرندی']},
 {id:'13',name:'منطقه ۱۳',neighborhoods:['آشتیانی','امامت','تهران‌نو','حافظیه','دهقان','زاهد گیلانی','شهید اسدی','صفا','نیروی هوایی (پیروزی)','بوستان سرخه حصار']},
 {id:'14',name:'منطقه ۱۴',neighborhoods:['آهنگ','آهنگران (سراسیاب دولاب)','ائمه اطهار','ابوذر','پرستار','تاکسیرانی','جابری','چهارصد دستگاه','دژکام','دولاب','شکوفه','شکیبا','شیوا','صد دستگاه','فرزانه','قصر فیروزه ۱','مینای جنوبی','مینای شمالی (مخبر)','نبی اکرم','نیکنام']},
];

const aliases:Record<string,string>={
 'نیروی هوایی (پیروزی)':'نیروی هوایی','پیروزی':'نیروی هوایی',
 'تهران‌نو':'تهران نو','سنگلج (شاپور)':'سنگلج','ارگ - پامنار':'پامنار',
 'آهنگران (سراسیاب دولاب)':'آهنگران','سرآسیاب دولاب':'آهنگران',
 'شکیبا':'شکیب','پاسدار گمنام':'شکیب',
 'مینای شمالی (مخبر)':'مینای شمالی','بوستان سرخه حصار':'سرخه حصار',
 'قصر فیروزه ۱':'قصر فیروزه',
};
export function neighborhoodSearchName(value:string){
 let text=value;
 for(const [from,to] of Object.entries(aliases).sort((a,b)=>b[0].length-a[0].length))text=text.split(from).join(to);
 return text.replace(/ي/g,'ی').replace(/ك/g,'ک').replace(/[\s\u200c-]+/g,' ').trim();
}
