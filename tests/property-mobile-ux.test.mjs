import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
test('real touch devices do not display simulated keyboard; typing remains at least 16px',async()=>{
 const keyboard=await readFile('app/mobile/Keyboard.tsx','utf8'),css=await readFile('app/mobile-runtime.css','utf8');
 assert.match(keyboard,/navigator.maxTouchPoints > 0\) return/);
 assert.match(css,/font-size: max\(16px,1rem\) !important/);
});
test('gallery supports swipes, next/previous controls and separate thumbnails',async()=>{
 const gallery=await readFile('app/property/PropertyGallery.tsx','utf8');
 for(const text of ['onTouchStart','onTouchEnd','رسانه قبلی','رسانه بعدی','property-gallery-thumbnails'])assert.ok(gallery.includes(text));
});
test('guest property form retains media locally until verification, then uses authenticated upload',async()=>{
 const form=await readFile('app/Prototype.tsx','utf8'),upload=await readFile('app/components/PropertyMediaUploader.tsx','utf8');
 assert.match(form,/if\(!canUpload&&!verified\)\{setVerifyForSubmit\(true\);return\}/);
 assert.match(form,/InlinePropertyVerification mobile=/);
 assert.match(upload,/if\(guest\)\{/);
});
