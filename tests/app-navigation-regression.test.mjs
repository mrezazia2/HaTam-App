import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const prototype=await readFile(new URL('../app/Prototype.tsx',import.meta.url),'utf8');
const consultants=await readFile(new URL('../app/consultants/ConsultantDirectory.tsx',import.meta.url),'utf8');
test('app routes retain property identifiers and restore detail on history navigation',()=>{
 assert.match(prototype,/searchParams\.set\("propertyId",String\(property.id\)\)/);
 assert.match(prototype,/const allowed:Screen\[\]=\["vip","valuation","consultant-properties","detail"/);
 assert.match(prototype,/p.get\("screen"\)==="detail"&&id/);
});
test('consultant directory links to app profiles, telephone and listings',()=>{
 assert.match(consultants,/screen=consultant-properties&consultantId=/);
 assert.match(consultants,/screen=consultant-profile&consultantId=/);
 assert.match(consultants,/tel:/);
 assert.doesNotMatch(consultants,/شروع گفت‌وگو/);
});
test('app valuation is distinct from map search and AI recommendations link to details',()=>{
 assert.match(prototype,/goSearch=\{\(\) => setScreen\("valuation"\)\}/);
 assert.match(prototype,/href=\{`\/app\?screen=detail&propertyId=\$\{encodeURIComponent\(item.id\)\}`\}/);
 assert.match(prototype,/url.searchParams.set\("ids",ids.join\(","\)\)/);
});
test('admin light controls cover text, selects, placeholders without changing modal backdrop',async()=>{
 const css=await readFile(new URL('../app/admin/light-controls.css',import.meta.url),'utf8');
 assert.match(css,/html\[data-theme="light"\]/);
 assert.match(css,/select,textarea/);
 assert.match(css,/::placeholder/);
 assert.match(css,/\.entity-modal>form/);
 assert.doesNotMatch(css,/\.urgent-admin-list>article,\.entity-modal,/);
});
