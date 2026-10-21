import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
test('guest property completion continues after OTP and retains staged media',async()=>{
 const source=await readFile('app/Prototype.tsx','utf8'),verification=await readFile('app/auth/InlinePropertyVerification.tsx','utf8');
 assert.match(source,/await submit\(true\)/);assert.match(source,/if\(!canUpload&&!verified\)/);assert.match(source,/key=\{mobileInput\(form.mobile\)\}/);assert.match(source,/flushPropertyMedia\(media,"user",setMedia\)/);assert.match(verification,/await onVerified\(\)/);
});
test('consultant cards hide internal IDs and expose editable profile fields',async()=>{
 const cards=await readFile('app/consultants/ConsultantDirectory.tsx','utf8'),settings=await readFile('app/portals/AccountSettingsView.tsx','utf8');assert.doesNotMatch(cards,/<span>\{item.id\}<\/span>/);assert.match(cards,/فایل‌های مشاور/);assert.match(settings,/\/api\/account\/avatar/);assert.match(settings,/JSON.stringify\(\{contactPhone,name,address,specialty,biography\}\)/);
});
