import test from 'node:test';
import assert from 'node:assert/strict';
import {asciiDigits,asciiNumerals,mobileInput,normalizeMobile} from '../app/auth/digits.ts';

test('authentication accepts Persian, Arabic and pasted international mobile digits',()=>{
  assert.equal(asciiDigits('۰۹۱۲٣٤٥٦٧٨٩'),'09123456789');
  assert.equal(asciiNumerals('کد ۱۲۳۴'),'کد 1234');
  assert.equal(normalizeMobile('۰۹۱۲۳۴۵۶۷۸۹'),'09123456789');
  assert.equal(normalizeMobile('٠٩١٢٣٤٥٦٧٨٩'),'09123456789');
  assert.equal(normalizeMobile('+۹۸ ۹۱۲ ۳۴۵ ۶۷۸۹'),'09123456789');
  assert.equal(mobileInput('+۹۸ ۹۱۲ ۳۴۵ ۶۷۸۹'),'09123456789');
  assert.equal(normalizeMobile('12345'),null);
});
