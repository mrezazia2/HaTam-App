import test from 'node:test';
import assert from 'node:assert/strict';
import {passkeyMessage} from '../app/auth/passkeys-client.ts';

test('Android browser failures are explained without exposing raw errors',()=>{
 const rejected=Object.assign(new Error('Platform-specific sensitive detail'),{name:'NotAllowedError',code:'ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY'});
 const message=passkeyMessage(rejected);
 assert.match(message,/NotAllowedError/);
 assert.match(message,/Chrome/);
 assert.doesNotMatch(message,/sensitive detail/);
 assert.match(passkeyMessage(new Error('PASSKEY_VERIFICATION_FAILED')),/سرور/);
 assert.match(passkeyMessage(new Error('PASSKEY_CHALLENGE_EXPIRED')),/زمان/);
});
