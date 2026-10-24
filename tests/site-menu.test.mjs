import test from 'node:test';
import assert from 'node:assert/strict';
import {cleanSiteMenu,defaultSiteMenu} from '../app/api/_lib/site-menu.ts';
test('site menu is independent and never routes into app/admin or external destinations',()=>{
 assert.ok(defaultSiteMenu.some(x=>x.href==='/trust'));
 assert.deepEqual(cleanSiteMenu([{href:'/trust',label:'Trust'},{href:'/app?screen=trust',label:'App'},{href:'//evil.example',label:'External'},{href:'/admin',label:'Admin'},{href:'https://evil.example',label:'External'}]).map(x=>x.href),['/trust']);
 assert.deepEqual(cleanSiteMenu([]),[]);
});
