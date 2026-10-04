import test from 'node:test';
import assert from 'node:assert/strict';
import {canManageProperty} from '../app/api/_lib/property-access.ts';
const property={ownerAccountId:'owner',consultantAccountId:'assigned',agencyId:'office'};
test('property management is limited to active responsible accounts',()=>{
 const viewer=(id,role,agencyId='office',status='active')=>({id,role,agencyId,status});
 for(const account of [viewer('owner','user'),viewer('assigned','consultant'),viewer('boss','agency'),viewer('admin','admin')]) assert.equal(canManageProperty(account,property),true);
 for(const account of [null,viewer('peer','consultant'),viewer('other','user'),viewer('boss','agency','different'),viewer('admin','admin',null,'suspended'),viewer('owner','user',null,'pending')]) assert.equal(canManageProperty(account,property),false);
});
