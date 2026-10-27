import test from 'node:test';
import assert from 'node:assert/strict';
import {matchesArchiveFilter} from '../app/components/archive-filter.ts';
const all={status:'',from:'',to:''};
test('archive status filters combine with Tehran inclusive date bounds',()=>{
 const filter={status:'pending',from:'2026-10-27',to:'2026-10-27'};
 assert.equal(matchesArchiveFilter({status:'pending',createdAt:'2026-10-26T20:30:00Z'},filter),true);
 assert.equal(matchesArchiveFilter({status:'pending',createdAt:'2026-10-27T20:29:59.999Z'},filter),true);
 assert.equal(matchesArchiveFilter({status:'pending',createdAt:'2026-10-27T20:30:00Z'},filter),false);
 assert.equal(matchesArchiveFilter({status:'published',createdAt:'2026-10-27T10:00:00Z'},filter),false);
});
test('unknown dates do not match active date filters; reset restores rows',()=>{
 assert.equal(matchesArchiveFilter({status:'new'},all),true);
 assert.equal(matchesArchiveFilter({status:'new'}, {...all,from:'2026-10-27'}),false);
 assert.equal(matchesArchiveFilter({createdAt:'invalid'}, {...all,to:'2026-10-27'}),false);
 assert.equal(matchesArchiveFilter({createdAt:1793095200},{...all,from:'2026-10-27',to:'2026-10-27'}),true);
 assert.equal(matchesArchiveFilter({createdAt:'2026-10-27'},{...all,from:'2026-10-28',to:'2026-10-26'}),false);
});
