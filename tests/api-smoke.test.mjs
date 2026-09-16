import assert from "node:assert/strict";
import test from "node:test";

const baseUrl=(process.env.HATAM_BASE_URL||"http://127.0.0.1:5173").replace(/\/$/,"");
const jsonHeaders={"content-type":"application/json"};
const role=role=>({"x-hatam-preview-role":role});

async function request(path,options={}){
 const response=await fetch(`${baseUrl}${path}`,options);
 const contentType=response.headers.get("content-type")||"";
 const body=contentType.includes("application/json")?await response.json():await response.text();
 return {response,body};
}

test("public and portal pages render",async()=>{
 for(const path of ["/","/app","/panel","/consultant","/agency","/admin","/login/user"]){
  const {response}=await request(path,{headers:{accept:"text/html"}});
  assert.ok(response.status>=200&&response.status<500,`${path} returned ${response.status}`);
  assert.match(response.headers.get("content-type")||"",/^text\/html/i);
 }
 const properties=await request("/api/properties",{headers:role("user")});
 if(properties.body.items?.[0]?.id){const details=await request(`/property/${encodeURIComponent(properties.body.items[0].id)}`,{headers:{accept:"text/html"}});assert.equal(details.response.status,200);assert.match(details.response.headers.get("content-type")||"",/^text\/html/i)}
});

test("core read APIs answer for every preview role",async()=>{
 for(const userRole of ["user","consultant","agency","admin"]){
  for(const path of ["/api/properties","/api/chat","/api/notifications"]){
   const {response,body}=await request(path,{headers:role(userRole)});
   assert.equal(response.status,200,`${userRole} ${path}: ${JSON.stringify(body)}`);
   assert.equal(body.ok,true);
  }
 }
});

test("admin control APIs are reachable",async()=>{
 for(const path of ["/api/admin/workspace","/api/admin/communication-center","/api/admin/integrations","/api/admin/audit-logs"]){
  const {response,body}=await request(path);
  assert.equal(response.status,200,`${path}: ${JSON.stringify(body)}`);
  assert.equal(body.ok,true);
 }
});

test("invalid property and media payloads are rejected without writes",async()=>{
 const property=await request("/api/properties",{method:"POST",headers:{...jsonHeaders,...role("user")},body:JSON.stringify({title:"x"})});
 assert.equal(property.response.status,400);
 assert.equal(property.body.error,"INVALID_PROPERTY");
 const media=await request("/api/property-media",{method:"POST",headers:role("consultant"),body:new FormData()});
 assert.equal(media.response.status,400);
 assert.equal(media.body.error,"INVALID_FILE");
});

test("invalid authentication payloads are rejected",async()=>{
 const otp=await request("/api/auth/request-otp",{method:"POST",headers:jsonHeaders,body:JSON.stringify({mobile:"123",role:"user",mode:"login"})});
 assert.equal(otp.response.status,400);
 assert.equal(otp.body.error,"INVALID_REQUEST");
 const password=await request("/api/auth/password-login",{method:"POST",headers:jsonHeaders,body:JSON.stringify({username:"123",password:"x",role:"user"})});
 assert.equal(password.response.status,400);
});

test("transactional APIs reject unknown references without creating records",async()=>{
 const headers={...jsonHeaders,...role("user")};
 const cases=[
  ["/api/payments/start",{intentId:"missing-intent"},404,"PAYMENT_NOT_FOUND"],
  ["/api/subscriptions",{planId:"missing-plan",paymentMethod:"wallet"},404,"PLAN_NOT_FOUND"],
  ["/api/favorites",{propertyId:"missing-property"},404,"PROPERTY_NOT_FOUND"],
  ["/api/visits",{propertyId:"missing-property",scheduledAt:new Date(Date.now()+86400000).toISOString()},404,"PROPERTY_NOT_AVAILABLE"],
 ];
 for(const [path,payload,status,error] of cases){const result=await request(path,{method:"POST",headers,body:JSON.stringify(payload)});assert.equal(result.response.status,status,`${path}: ${JSON.stringify(result.body)}`);assert.equal(result.body.error,error)}
});

test("payment status requires authentication and validates references",async()=>{
 const anonymous=await request("/api/payments/status?intent=missing");
 assert.equal(anonymous.response.status,401);
 const missing=await request("/api/payments/status",{headers:role("user")});
 assert.equal(missing.response.status,400);
 const unknown=await request("/api/payments/status?intent=missing",{headers:role("user")});
 assert.equal(unknown.response.status,404);
 assert.equal(unknown.response.headers.get("cache-control"),"no-store");
 const callback=await fetch(`${baseUrl}/api/payments/callback?intent=missing`,{redirect:"manual"});
 assert.equal(callback.status,303);
 assert.equal(callback.headers.get("cache-control"),"no-store");
});

test("health endpoint confirms local infrastructure bindings",async()=>{
 const {response,body}=await request("/api/system/health");
 assert.ok([200,503].includes(response.status));
 assert.equal(body.checks.database,true);
 assert.equal(body.checks.media,true);
 assert.equal(typeof body.checks.authSecret,"boolean");
 assert.equal(typeof body.checks.integrationSecret,"boolean");
 assert.equal(typeof body.checks.automationSecret,"boolean");
});
