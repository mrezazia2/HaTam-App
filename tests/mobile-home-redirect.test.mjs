import test from 'node:test';import assert from 'node:assert/strict';
import {mobileHomeDestination} from '../app/navigation/mobile-home.ts';
test('phones enter web app while desktop stays on site',()=>{
 assert.equal(mobileHomeDestination('Mozilla/5.0 (Linux; Android 14) Mobile Safari','hatamestate.com',''),'https://web.hatamestate.com/app');
 assert.equal(mobileHomeDestination('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)','hatamestate.com',''),'https://web.hatamestate.com/app');
 assert.equal(mobileHomeDestination('Mozilla/5.0 (Windows NT 10.0; Win64; x64)','hatamestate.com',''),null);
 assert.equal(mobileHomeDestination('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)','hatamestate.com',''),null);
 assert.equal(mobileHomeDestination('iPhone','hatamestate.com','?site=1'),null);
 assert.equal(mobileHomeDestination('iPhone','127.0.0.1',''),'/app');
});
