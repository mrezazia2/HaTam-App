import test from 'node:test';
import assert from 'node:assert/strict';
import {serverSecret,sessionToken,trustedMutation} from '../app/auth/security.ts';

test('production refuses absent or short secrets; local fallback remains local',()=>{
 for(const secret of [undefined,'short']) assert.throws(()=>serverSecret('AUTH_SECRET',secret,true,'local'));
 assert.equal(serverSecret('AUTH_SECRET','x'.repeat(32),true,'local'),'x'.repeat(32));
 assert.equal(serverSecret('AUTH_SECRET',undefined,false,'local'),'local');
});
test('session cookies decode safely and preserve token content',()=>{
 assert.equal(sessionToken('other=x; hatam_session=abc%3D; theme=dark'),'abc=');
 for(const cookie of ['', 'hatam_session=%ZZ','hatam_session=','hatam_session='+'x'.repeat(1025)]) assert.equal(sessionToken(cookie),null);
});
test('cookie write origin rejects cross-site, null, malformed and sibling subdomains',()=>{
 const req=(headers,method='POST')=>new Request('https://app.example.com/api/wallet',{method,headers});
 for(const origin of ['https://evil.example','https://admin.example.com','null','broken']) assert.equal(trustedMutation(req({origin})),false);
 assert.equal(trustedMutation(req({'sec-fetch-site':'cross-site'})),false);
 assert.equal(trustedMutation(req({origin:'https://app.example.com'})),true);
 assert.equal(trustedMutation(req({})),true);
 assert.equal(trustedMutation(req({origin:'https://elsewhere.example'},'GET')),true);
});
