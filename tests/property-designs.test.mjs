import test from 'node:test';
import assert from 'node:assert/strict';
import {validateValuation,valuationNotes} from '../app/mobile/valuation-validation.ts';
import {rankSimilarProperties} from '../app/property/similar-ranking.ts';
import {readFile} from 'node:fs/promises';
const form={name:'مالک آزمایشی',mobile:'09120000001',address:'تهران منطقه ۱۳، آدرس کامل',area:'80',year:'1400',bedrooms:2,floor:1,units:2,price:'5000000000',amenities:['پارکینگ','آسانسور']};
test('valuation validates every form field and serializes details for admin',()=>{
 assert.deepEqual(validateValuation(form),{});assert.match(valuationNotes(form),/واحد در طبقه: 2/);
 for(const patch of [{name:'نام'},{mobile:'123'},{area:'-1'},{year:'1299'},{price:'bad'},{floor:-1},{units:0},{bedrooms:1.5}])assert.ok(Object.keys(validateValuation({...form,...patch})).length);
});
test('similar properties exclude current and other transaction types; favor same area',()=>{
 const current={id:'a',district:'13',area:80,bedrooms:2,price:500,transactionType:'sale'};
 const items=[current,{...current,id:'rent',transactionType:'rent'},{...current,id:'near',area:85},{...current,id:'far',district:'14'},{...current,id:'larger',area:120}];
 assert.deepEqual(rankSimilarProperties(items,current).map(x=>x.id),['near','larger','far']);
});
test('featured archive and filter have independent routes and do not use VIP access',async()=>{
 const source=await readFile('app/Prototype.tsx','utf8'),archive=await readFile('app/mobile/FeaturedProperties.tsx','utf8');
 assert.match(source,/screen === "featured-filter"/);assert.match(source,/featuredFilters/);assert.match(archive,/query.set\('featured','1'\)/);
 assert.doesNotMatch(archive,/\/api\/vip/);
});
