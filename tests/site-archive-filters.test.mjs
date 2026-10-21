import test from 'node:test';
import assert from 'node:assert/strict';
import {matchesArchiveFilters,emptyArchiveFilters} from '../app/site/archive-filters.ts';
const property={price:5000000000,area:90,bedrooms:2,description:JSON.stringify({buildYear:1400,totalFloors:5,unitsPerFloor:2,amenities:['آسانسور','پارکینگ']})};
test('site archive manual filters match structured public property data',()=>{
 assert.equal(matchesArchiveFilters(property,{...emptyArchiveFilters,minPrice:'4000000000',maxSize:'100',minYear:'1399',floors:'5',units:'2',amenities:['پارکینگ']}),true);
 for(const filter of [{minPrice:'6000000000'},{maxPrice:'4000000000'},{minSize:'100'},{beds:'3'},{minYear:'1401'},{floors:'6'},{units:'3'},{amenities:['بالکن']}]){
  assert.equal(matchesArchiveFilters(property,{...emptyArchiveFilters,...filter}),false,JSON.stringify(filter));
 }
});
test('unknown building years and malformed descriptions cannot match year or amenity filters',()=>{
 const unknown={...property,description:'not json'};
 assert.equal(matchesArchiveFilters(unknown,{...emptyArchiveFilters}),true);
 assert.equal(matchesArchiveFilters(unknown,{...emptyArchiveFilters,minYear:'1390'}),false);
 assert.equal(matchesArchiveFilters(unknown,{...emptyArchiveFilters,amenities:['پارکینگ']}),false);
});
