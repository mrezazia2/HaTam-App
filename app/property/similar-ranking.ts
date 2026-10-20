type SimilarProperty={id:string;district?:string|null;area:number;price:number;bedrooms:number;transactionType:string};
export function rankSimilarProperties<T extends SimilarProperty>(items:T[],current:SimilarProperty):T[]{
 return items.filter(x=>x.id!==current.id&&x.transactionType===current.transactionType).map(item=>({item,score:(current.district&&item.district!==current.district?6:0)+Math.abs(item.area-current.area)/Math.max(1,current.area)+Math.abs(item.price-current.price)/Math.max(1,current.price)+Math.abs(item.bedrooms-current.bedrooms)*.3})).sort((a,b)=>a.score-b.score||a.item.id.localeCompare(b.item.id)).slice(0,5).map(x=>x.item);
}
