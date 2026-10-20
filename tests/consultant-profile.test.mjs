import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
test('consultant profile exposes published files and phone without synthetic ratings',async()=>{
 const profile=await readFile('app/consultants/ConsultantProfile.tsx','utf8');
 assert.match(profile,/\/api\/consultants\?id=/);assert.match(profile,/tel:/);assert.match(profile,/screen=consultant-properties/);
 assert.doesNotMatch(profile,/online-dot|StarFilledIcon/);
});
test('featured light theme explicitly styles row text, price, thumbnail and fixed filter',async()=>{
 const css=await readFile('app/mobile/app-property-pages.css','utf8');
 for(const selector of ['.property-row-price strong','.property-row-image','.property-row-copy p','.app-featured-fixed-filter button'])assert.ok(css.includes(selector));
 assert.match(css,/html\[data-theme=light\] \.app-featured-page/);
});
