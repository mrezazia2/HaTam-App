import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
test('splash persists launch marker across app document navigation',async()=>{
 const source=await readFile('app/mobile/AppSplash.tsx','utf8');
 assert.match(source,/sessionStorage.getItem\(key\)/);
 assert.match(source,/sessionStorage.setItem\(key,'1'\)/);
 assert.match(source,/useState\(false\)/);
});
test('native touch gestures are not captured by simulated mobile scrolling',async()=>{
 const source=await readFile('app/mobile/MobileScroll.tsx','utf8');
 assert.match(source,/event.pointerType === "touch"\) return/);
 const css=await readFile('app/mobile-runtime.css','utf8');
 assert.match(css,/\.hatam-app \.mobile-scroll \{ touch-action: pan-y/);
});
test('consultant listing fallback returns to directory, same-app links retain history',async()=>{
 const source=await readFile('app/Prototype.tsx','utf8');
 assert.match(source,/screenRef.current==="consultant-properties"\)\{setScreen\("consultants"\)/);
 assert.match(source,/pushState\(\{hatamPrevious:previous\}/);
});
