import test from 'node:test';import assert from 'node:assert/strict';
import {publicProperty} from '../app/api/_lib/public-property.ts';
test('public listing excludes private brokerage fields and owner contact',()=>{
 const result=publicProperty({id:'p',ownerMobile:'private',ownerAccountId:'u',description:JSON.stringify({internalPrice:'secret',name:'private',office:'private',amenities:['پارکینگ'],age:'1400'})});
 assert.equal('ownerMobile' in result,false);assert.equal('ownerAccountId' in result,false);assert.equal(JSON.stringify(result).includes('secret'),false);assert.deepEqual(JSON.parse(result.description),{amenities:['پارکینگ'],age:'1400'});
});
