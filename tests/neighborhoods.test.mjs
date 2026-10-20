import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeFilterConfig} from '../app/mobile/filter-config.ts';
import {tehranNeighborhoods,neighborhoodSearchName} from '../app/mobile/tehran-neighborhoods.ts';
test('legacy region lists upgrade once; subsequent admin customizations survive',()=>{
 const old={regions:[{id:'14',name:'منطقه ۱۴',neighborhoods:['فلاح','شاهین']}],amenities:['سفارشی']};
 const upgraded=normalizeFilterConfig(old);
 assert.deepEqual(upgraded.regions[0].neighborhoods,tehranNeighborhoods[2].neighborhoods);
 assert.deepEqual(upgraded.amenities,['سفارشی']);
 const edited={...upgraded,regions:[{id:'14',name:'منطقه ۱۴',neighborhoods:['محله سفارشی']}]};
 assert.deepEqual(normalizeFilterConfig(edited).regions,edited.regions);
});
test('Divar labels match older saved property addresses',()=>{
 assert.equal(neighborhoodSearchName('تهران‌نو'),neighborhoodSearchName('تهران نو'));
 assert.equal(neighborhoodSearchName('نیروی هوایی (پیروزی)'),neighborhoodSearchName('نیروی هوایی'));
 for(const region of tehranNeighborhoods)assert.equal(new Set(region.neighborhoods).size,region.neighborhoods.length);
 assert.ok(!tehranNeighborhoods[2].neighborhoods.includes('فلاح'));
});
