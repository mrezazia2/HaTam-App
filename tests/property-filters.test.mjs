import test from 'node:test';import assert from 'node:assert/strict';
import {numericInput,matchesProperty} from '../app/mobile/property-filters.ts';
test('Persian and Arabic numeric input preserves digits when editing prices',()=>{assert.equal(numericInput('۱۲٬۳۴۵٬۶۷۸'),'12345678');assert.equal(numericInput('١٢٣٤'),'1234')});
test('property filters use price, area, bedrooms, location, year and amenities',()=>{
 const p={amount:500,size:80,beds:2,district:'13',area:'نیروی هوایی',buildingYear:1400,amenities:['پارکینگ']};
 assert.equal(matchesProperty(p,{minPrice:'400',maxPrice:'600',regions:['13','14'],minBuildYear:'1399',maxBuildYear:'1401'}),true);
 for(const f of [{minPrice:'501'},{maxPrice:'499'},{minArea:'81'},{beds:3},{regions:['14']},{neighborhoods:['پیروزی']},{minBuildYear:'1401'},{amenities:['آسانسور']}])assert.equal(matchesProperty(p,{minPrice:'',maxPrice:'',...f}),false);
});
