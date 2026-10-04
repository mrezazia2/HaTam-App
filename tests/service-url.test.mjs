import test from 'node:test';
import assert from 'node:assert/strict';
import {serviceUrl,fetchService} from '../app/api/_lib/service-url.ts';
const host='api.vendor.example';
test('service URLs require exact approved HTTPS hosts and forbid credentials, IPs and local targets',()=>{
 assert.equal(serviceUrl(`https://${host}/send`,host),`https://${host}/send`);
 for(const url of ['http://api.vendor.example','https://api.vendor.example.evil.com','https://127.0.0.1','https://2130706433','https://[::1]','https://169.254.169.254','https://localhost','https://service.internal','https://api.vendor.example:8443','https://secret@api.vendor.example','https://api.vendor.example/#secret','not a URL']) assert.throws(()=>serviceUrl(url,host));
 assert.throws(()=>serviceUrl(`https://${host}`,''));
 assert.throws(()=>serviceUrl('https://localhost','localhost'));
 assert.throws(()=>serviceUrl('https://127.0.0.1','127.0.0.1'));
});
test('service fetch validates before network and never follows redirects',async()=>{
 let calls=0;
 const send=async(url,init)=>{calls++;assert.equal(init.redirect,'error');return new Response('',{status:302,headers:{location:'http://127.0.0.1'}})};
 await assert.rejects(fetchService('https://unapproved.example',{},host,send));assert.equal(calls,0);
 await assert.rejects(fetchService(`https://${host}`,{},host,send),/SERVICE_REDIRECT_BLOCKED/);assert.equal(calls,1);
});
