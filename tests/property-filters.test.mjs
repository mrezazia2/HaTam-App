import test from 'node:test';import assert from 'node:assert/strict';
import {numericInput,matchesProperty,parsePropertyFilters,propertyBuildingYear,propertyFilterQuery} from '../app/mobile/property-filters.ts';
test('Persian and Arabic numeric input preserves digits when editing prices',()=>{assert.equal(numericInput('۱۲٬۳۴۵٬۶۷۸'),'12345678');assert.equal(numericInput('١٢٣٤'),'1234')});
test('property filters use price, area, bedrooms, location, year and amenities',()=>{
 const p={amount:500,size:80,beds:2,district:'13',area:'نیروی هوایی',buildingYear:1400,amenities:['پارکینگ']};
 assert.equal(matchesProperty(p,{minPrice:'400',maxPrice:'600',regions:['13','14'],minBuildYear:'1399',maxBuildYear:'1401'}),true);
 for(const f of [{minPrice:'501'},{maxPrice:'499'},{minArea:'81'},{beds:3},{regions:['14']},{neighborhoods:['پرستار']},{minBuildYear:'1401'},{amenities:['آسانسور']}])assert.equal(matchesProperty(p,{minPrice:'',maxPrice:'',...f}),false);
 assert.equal(matchesProperty(p,{minPrice:'',maxPrice:'',neighborhoods:['نیروی هوایی (پیروزی)']}),true);
});
test('mobile filter parameters round-trip to the property API',()=>{
 const selected={minPrice:'5000000000',maxPrice:'20000000000',regions:['13','14'],neighborhoods:['پیروزی','نبرد'],amenities:['پارکینگ'],beds:2,latitude:35.7,longitude:51.4,radius:800};
 const parsed=parsePropertyFilters(propertyFilterQuery(selected));
 assert.equal(parsed?.minPrice,selected.minPrice);
 assert.deepEqual(parsed?.regions,selected.regions);
 assert.deepEqual(parsed?.neighborhoods,selected.neighborhoods);
 assert.deepEqual(parsed?.amenities,selected.amenities);
 assert.equal(parsed?.radius,800);
 assert.equal(parsePropertyFilters(new URLSearchParams()),undefined);
});
test('construction age in a submitted property matches Jalali year filters',()=>{
 const now=new Date('2026-10-04T00:00:00Z');
 assert.equal(propertyBuildingYear({age:'10'},now),1395);
 assert.equal(propertyBuildingYear({buildYear:'1398',age:'10'},now),1398);
 assert.equal(propertyBuildingYear({},now),undefined);
});
