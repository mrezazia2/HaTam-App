import test from "node:test";
import assert from "node:assert/strict";
import {gatewayAvailable,gatewayConfigured} from "../app/api/_lib/payment-config.ts";

const config={
  requestUrl:"https://api.example.com/request",
  verifyUrl:"https://api.example.com/verify",
  paymentUrlTemplate:"https://pay.example.com/{authority}",
  callbackUrl:"https://app.hatamestate.com/api/payments/callback",
  authorityPath:"data.authority",
  verifyCodePath:"data.code",
  merchantId:"merchant-test",
};

test("a disabled gateway keeps its configuration without becoming available",()=>{
  const settings={enabled:false,encryptedSecret:null,publicConfig:config};
  assert.equal(gatewayConfigured(settings),true);
  assert.equal(gatewayAvailable(settings),false);
});

test("merchant-only providers can be enabled; incomplete settings cannot",()=>{
  assert.equal(gatewayAvailable({enabled:true,encryptedSecret:null,publicConfig:config}),true);
  assert.equal(gatewayAvailable({enabled:true,encryptedSecret:null,publicConfig:{...config,merchantId:""}}),false);
  assert.equal(gatewayAvailable({enabled:true,encryptedSecret:"encrypted",publicConfig:{...config,merchantId:""}}),true);
  assert.equal(gatewayAvailable({enabled:true,encryptedSecret:null,publicConfig:{...config,verifyUrl:""}}),false);
});
