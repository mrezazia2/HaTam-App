import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes,createHash} from 'node:crypto';
import {mkdtemp} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {SqliteBinding} from '../runtime/sqlite.mjs';

test('VPS production HTTP: public routes, authenticated panels and blocked preview bypass',async()=>{
 process.env.NODE_ENV='production';
 process.env.AUTH_SECRET=randomBytes(32).toString('hex');
 process.env.INTEGRATION_SECRET_KEY=randomBytes(32).toString('hex');
 process.env.AUTOMATION_SECRET=randomBytes(32).toString('hex');
 process.env.INTEGRATION_ALLOWED_HOSTS='api.vendor.example';
 process.env.HATAM_DATA_DIR=await mkdtemp(join(tmpdir(),'hatam-http-'));
 const db=new SqliteBinding(join(process.env.HATAM_DATA_DIR,'hatam.sqlite'));db.migrate(resolve('drizzle'));
 const cookies={};
 for(const [i,role] of ['admin','user','consultant','agency'].entries()){
  const token=randomBytes(32).toString('hex');cookies[role]=`hatam_session=${token}`;
  await db.prepare("INSERT INTO accounts(id,role,name,mobile,status,created_at,updated_at) VALUES (?,?,?,?,'active',?,?)").bind(role,role,'Test',`0912000000${i}`,Date.now(),Date.now()).run();
  await db.prepare('INSERT INTO sessions(id,account_id,token_hash,expires_at,created_at) VALUES (?,?,?,?,?)').bind(role,role,createHash('sha256').update(`${process.env.AUTH_SECRET}:${token}`).digest('hex'),Date.now()+600000,Date.now()).run();
 }
 await db.prepare("UPDATE accounts SET agency_id='office' WHERE role IN ('consultant','agency')").run();
 for(const [id,status] of [['private','pending'],['public','published']]){
  await db.prepare("INSERT INTO properties(id,title,owner_account_id,consultant_account_id,agency_id,owner_mobile,address,transaction_type,property_type,area,bedrooms,price,status,created_at,updated_at) VALUES (?,?,'user','assigned-other','office','09121111111','Test address','sale','apartment',80,2,1000000,?,?,?)").bind(id,'Test property',status,Date.now(),Date.now()).run();
 }
 const workspaceNow=Date.now();
 await db.prepare("INSERT INTO properties(id,title,owner_account_id,consultant_account_id,agency_id,owner_mobile,address,transaction_type,property_type,area,bedrooms,price,status,created_at,updated_at) VALUES ('consultant-property','Consultant property','user','consultant','office','09120000001','Test address','sale','apartment',90,2,2000000,'published',?,?)").bind(workspaceNow,workspaceNow).run();
 await db.prepare("INSERT INTO leads(id,agency_id,consultant_account_id,name,mobile,request,status,created_at,updated_at) VALUES ('lead-1','office','consultant','Lead user','09121111111','Buy apartment','new',?,?)").bind(workspaceNow,workspaceNow).run();
 await db.prepare("INSERT INTO visits(id,property_id,customer_account_id,consultant_account_id,scheduled_at,status,created_at,updated_at) VALUES ('visit-1','consultant-property','user','consultant',?,'completed',?,?)").bind(workspaceNow,workspaceNow,workspaceNow).run();
 await db.prepare("INSERT INTO consultations(id,customer_account_id,consultant_account_id,property_id,subject,status,notes,created_at,updated_at) VALUES ('consultation-1','user','consultant','consultant-property','Test consultation','completed','',?,?)").bind(workspaceNow,workspaceNow).run();
 await db.prepare("INSERT INTO contracts(id,agency_id,property_id,consultant_account_id,customer_name,amount,status,created_at,updated_at) VALUES ('contract-1','office','consultant-property','consultant','Test customer',3000000,'completed',?,?)").bind(workspaceNow,workspaceNow).run();
 await db.prepare("INSERT INTO agency_branches(id,agency_id,name,phone,address,status,created_at,updated_at) VALUES ('foreign-branch','another-office','Foreign','02100000000','Elsewhere','active',?,?)").bind(workspaceNow,workspaceNow).run();
 await db.prepare("INSERT INTO accounts(id,role,name,mobile,status,agency_id,created_at,updated_at) VALUES ('foreign-consultant','consultant','Foreign consultant','09129999999','active','another-office',?,?)").bind(workspaceNow,workspaceNow).run();
 await db.prepare("INSERT INTO agency_members(id,agency_id,account_id,title,status,created_at,updated_at) VALUES ('foreign-member','another-office','foreign-consultant','Consultant','active',?,?)").bind(workspaceNow,workspaceNow).run();
 await db.prepare("INSERT INTO properties(id,title,agency_id,owner_mobile,address,transaction_type,property_type,area,bedrooms,price,status,created_at,updated_at) VALUES ('foreign-property','Foreign property','another-office','09129999999','Other address','sale','apartment',75,1,700000,'pending',?,?)").bind(workspaceNow,workspaceNow).run();
 await db.prepare("INSERT INTO leads(id,agency_id,name,mobile,request,status,created_at,updated_at) VALUES ('foreign-lead','another-office','Foreign lead','09128888888','Other request','new',?,?)").bind(workspaceNow,workspaceNow).run();
 await db.prepare("INSERT INTO contracts(id,agency_id,customer_name,amount,status,created_at,updated_at) VALUES ('foreign-contract','another-office','Foreign customer',9000,'draft',?,?)").bind(workspaceNow,workspaceNow).run();
 const {startProdServer}=await import('../node_modules/vinext/dist/server/prod-server.js');
 const {server,port}=await startProdServer({host:'127.0.0.1',port:0,outDir:resolve('dist')});
 const request=(path,options={})=>fetch(`http://127.0.0.1:${port}${path}`,{...options,redirect:'manual'});
 try{
  for(const path of ['/','/app','/api/system/health']){const r=await request(path);assert.equal(r.status,200,path);await r.arrayBuffer();}
  for(const path of ['/api/admin/finance','/api/wallet']){const r=await request(path,{headers:{'x-hatam-preview-role':'admin'}});assert.ok([401,403].includes(r.status),`${path}: ${r.status}`);await r.arrayBuffer();}
  const cron=await request('/api/system/process-communications',{method:'POST'});assert.equal(cron.status,403);await cron.arrayBuffer();
  for(const [role,path] of [['admin','/admin'],['admin','/admin/schedule'],['user','/panel'],['consultant','/consultant'],['agency','/agency']]){const r=await request(path,{headers:{cookie:cookies[role]}});assert.equal(r.status,200,`${path}: ${await r.text()}`);}
  const finance=await request('/api/admin/finance',{headers:{cookie:cookies.admin}});assert.equal(finance.status,200);assert.equal((await finance.json()).ok,true);
  const consultantWorkspace=await request('/api/consultant/workspace',{headers:{cookie:cookies.consultant}});assert.equal(consultantWorkspace.status,200);const consultantData=await consultantWorkspace.json();assert.equal(consultantData.leads.length,1);assert.equal(consultantData.clients.length,1);assert.equal(consultantData.performance.completedVisits,1);assert.equal(consultantData.performance.completedConsultations,1);assert.equal(consultantData.performance.completedContracts,1);assert.equal(consultantData.performance.contractValue,3000000);
  const forbiddenWorkspace=await request('/api/consultant/workspace',{headers:{cookie:cookies.user}});assert.equal(forbiddenWorkspace.status,403);await forbiddenWorkspace.arrayBuffer();
  const leadUpdated=await request('/api/consultant/workspace',{method:'PATCH',headers:{cookie:cookies.consultant,'content-type':'application/json'},body:JSON.stringify({id:'lead-1',status:'qualified'})});assert.equal(leadUpdated.status,200);await leadUpdated.arrayBuffer();assert.equal((await db.prepare("SELECT status FROM leads WHERE id='lead-1'").first()).status,'qualified');assert.equal((await db.prepare("SELECT COUNT(*) total FROM audit_logs WHERE action='lead.status' AND entity_id='lead-1'").first()).total,1);
  const profile=await request('/api/account/profile',{headers:{cookie:cookies.consultant}});assert.equal(profile.status,200);assert.equal((await profile.json()).profile.mobile,'09120000002');
  const profileSaved=await request('/api/account/profile',{method:'PATCH',headers:{cookie:cookies.consultant,'content-type':'application/json'},body:JSON.stringify({name:'Consultant QA',address:'Tehran'})});assert.equal(profileSaved.status,200);assert.equal((await profileSaved.json()).profile.address,'Tehran');assert.equal((await db.prepare("SELECT name FROM accounts WHERE id='consultant'").first()).name,'Consultant QA');
  const workflowSchedule=new Date(Date.now()+24*60*60_000).toISOString();
  const visitCreated=await request('/api/visits',{method:'POST',headers:{cookie:cookies.user,'content-type':'application/json'},body:JSON.stringify({propertyId:'consultant-property',scheduledAt:workflowSchedule})});assert.equal(visitCreated.status,201);const visitId=(await visitCreated.json()).id;assert.equal((await db.prepare("SELECT COUNT(*) total FROM reminders WHERE event_type='visit' AND event_id=? AND status='pending'").bind(visitId).first()).total,2);assert.equal((await db.prepare("SELECT COUNT(*) total FROM conversations WHERE subject=?").bind(`هماهنگی بازدید ${visitId}`).first()).total,1);
  const visitForbidden=await request('/api/visits',{method:'PATCH',headers:{cookie:cookies.user,'content-type':'application/json'},body:JSON.stringify({id:visitId,status:'confirmed',scheduledAt:workflowSchedule})});assert.equal(visitForbidden.status,400);await visitForbidden.arrayBuffer();
  const visitConfirmed=await request('/api/visits',{method:'PATCH',headers:{cookie:cookies.consultant,'content-type':'application/json'},body:JSON.stringify({id:visitId,status:'confirmed',scheduledAt:workflowSchedule})});assert.equal(visitConfirmed.status,200);await visitConfirmed.arrayBuffer();assert.equal((await db.prepare("SELECT COUNT(*) total FROM reminders WHERE event_type='visit' AND event_id=? AND status='pending'").bind(visitId).first()).total,2);assert.equal((await db.prepare("SELECT COUNT(*) total FROM audit_logs WHERE action='visit.status_changed' AND entity_id=?").bind(visitId).first()).total,1);
  const visitAgencyView=await request('/api/visits',{headers:{cookie:cookies.agency}});assert.equal(visitAgencyView.status,200);assert.ok((await visitAgencyView.json()).items.some(item=>item.id===visitId));
  const consultationCreated=await request('/api/consultations',{method:'POST',headers:{cookie:cookies.user,'content-type':'application/json'},body:JSON.stringify({propertyId:'consultant-property',subject:'QA consultation',notes:'Initial note',scheduledAt:workflowSchedule})});assert.equal(consultationCreated.status,201);const consultationId=(await consultationCreated.json()).id;assert.equal((await db.prepare("SELECT COUNT(*) total FROM reminders WHERE event_type='consultation' AND event_id=? AND status='pending'").bind(consultationId).first()).total,2);
  const consultationScheduled=await request('/api/consultations',{method:'PATCH',headers:{cookie:cookies.consultant,'content-type':'application/json'},body:JSON.stringify({id:consultationId,status:'scheduled',scheduledAt:workflowSchedule,notes:'Confirmed note'})});assert.equal(consultationScheduled.status,200);await consultationScheduled.arrayBuffer();assert.equal((await db.prepare('SELECT notes FROM consultations WHERE id=?').bind(consultationId).first()).notes,'Confirmed note');assert.equal((await db.prepare("SELECT COUNT(*) total FROM notifications WHERE type IN ('visit_status','consultation_status')").first()).total,4);
  const bootstrapIdempotent=await request('/api/communications/bootstrap',{method:'POST',headers:{cookie:cookies.user,'content-type':'application/json'},body:JSON.stringify({eventType:'visit',eventId:visitId})});assert.equal(bootstrapIdempotent.status,200);assert.equal((await bootstrapIdempotent.json()).reminders,0);assert.equal((await db.prepare("SELECT COUNT(*) total FROM conversations WHERE subject=?").bind(`هماهنگی بازدید ${visitId}`).first()).total,1);
  const branchCreated=await request('/api/agency/workspace',{method:'POST',headers:{cookie:cookies.agency,'content-type':'application/json'},body:JSON.stringify({resource:'branches',payload:{name:'Central branch',phone:'02112345678',address:'Tehran 13'}})});assert.equal(branchCreated.status,200);const branchId=(await branchCreated.json()).id;
  const agencyWorkspace=await request('/api/agency/workspace',{headers:{cookie:cookies.agency}});assert.equal(agencyWorkspace.status,200);assert.ok((await agencyWorkspace.json()).branches.some(item=>item.id===branchId));
  const branchEdited=await request('/api/agency/workspace',{method:'POST',headers:{cookie:cookies.agency,'content-type':'application/json'},body:JSON.stringify({resource:'branches',payload:{id:branchId,name:'East branch',phone:'02112345678',address:'Tehran 14',status:'suspended'}})});assert.equal(branchEdited.status,200);await branchEdited.arrayBuffer();assert.equal((await db.prepare('SELECT status FROM agency_branches WHERE id=?').bind(branchId).first()).status,'suspended');
  const crossAgencyEdit=await request('/api/agency/workspace',{method:'POST',headers:{cookie:cookies.agency,'content-type':'application/json'},body:JSON.stringify({resource:'branches',payload:{id:'foreign-branch',name:'Taken over',address:'Tehran'}})});assert.equal(crossAgencyEdit.status,404);await crossAgencyEdit.arrayBuffer();assert.equal((await db.prepare("SELECT name FROM agency_branches WHERE id='foreign-branch'").first()).name,'Foreign');
  const forbiddenAgencyWorkspace=await request('/api/agency/workspace',{headers:{cookie:cookies.consultant}});assert.equal(forbiddenAgencyWorkspace.status,403);await forbiddenAgencyWorkspace.arrayBuffer();
  const branchDeleted=await request(`/api/agency/workspace?resource=branches&id=${encodeURIComponent(branchId)}`,{method:'DELETE',headers:{cookie:cookies.agency}});assert.equal(branchDeleted.status,200);await branchDeleted.arrayBuffer();assert.equal((await db.prepare('SELECT COUNT(*) total FROM agency_branches WHERE id=?').bind(branchId).first()).total,0);
  const memberCreated=await request('/api/agency/workspace',{method:'POST',headers:{cookie:cookies.agency,'content-type':'application/json'},body:JSON.stringify({resource:'members',payload:{mobile:'09120000002',title:'Senior consultant',status:'active'}})});assert.equal(memberCreated.status,200);const memberId=(await memberCreated.json()).id;
  const memberEdited=await request('/api/agency/workspace',{method:'POST',headers:{cookie:cookies.agency,'content-type':'application/json'},body:JSON.stringify({resource:'members',payload:{id:memberId,mobile:'09120000002',title:'Sales consultant',status:'active'}})});assert.equal(memberEdited.status,200);await memberEdited.arrayBuffer();assert.equal((await db.prepare('SELECT title FROM agency_members WHERE id=?').bind(memberId).first()).title,'Sales consultant');
  const foreignMemberRejected=await request('/api/agency/workspace',{method:'POST',headers:{cookie:cookies.agency,'content-type':'application/json'},body:JSON.stringify({resource:'members',payload:{mobile:'09129999999',title:'Taken over',status:'active'}})});assert.equal(foreignMemberRejected.status,409);await foreignMemberRejected.arrayBuffer();
  const propertyUnassigned=await request('/api/agency/workspace',{method:'POST',headers:{cookie:cookies.agency,'content-type':'application/json'},body:JSON.stringify({resource:'assign-property',payload:{propertyId:'consultant-property',consultantAccountId:null}})});assert.equal(propertyUnassigned.status,200);await propertyUnassigned.arrayBuffer();assert.equal((await db.prepare("SELECT consultant_account_id value FROM properties WHERE id='consultant-property'").first()).value,null);
  const propertyAssigned=await request('/api/agency/workspace',{method:'POST',headers:{cookie:cookies.agency,'content-type':'application/json'},body:JSON.stringify({resource:'assign-property',payload:{propertyId:'consultant-property',consultantAccountId:'consultant'}})});assert.equal(propertyAssigned.status,200);await propertyAssigned.arrayBuffer();assert.equal((await db.prepare("SELECT consultant_account_id value FROM properties WHERE id='consultant-property'").first()).value,'consultant');assert.equal((await db.prepare("SELECT COUNT(*) total FROM audit_logs WHERE action='agency.property_assigned' AND entity_id='consultant-property'").first()).total,2);
  const foreignPropertyAssign=await request('/api/agency/workspace',{method:'POST',headers:{cookie:cookies.agency,'content-type':'application/json'},body:JSON.stringify({resource:'assign-property',payload:{propertyId:'foreign-property',consultantAccountId:'consultant'}})});assert.equal(foreignPropertyAssign.status,404);await foreignPropertyAssign.arrayBuffer();
  const foreignConsultantAssign=await request('/api/agency/workspace',{method:'POST',headers:{cookie:cookies.agency,'content-type':'application/json'},body:JSON.stringify({resource:'assign-property',payload:{propertyId:'consultant-property',consultantAccountId:'foreign-consultant'}})});assert.equal(foreignConsultantAssign.status,400);await foreignConsultantAssign.arrayBuffer();
  const managedProperty=await request('/api/properties/consultant-property',{headers:{cookie:cookies.agency}});assert.equal(managedProperty.status,200);assert.equal((await managedProperty.json()).item.id,'consultant-property');
  const editedProperty=await request('/api/properties/consultant-property',{method:'PATCH',headers:{cookie:cookies.agency,'content-type':'application/json'},body:JSON.stringify({title:'Agency edited property',address:'Edited address in Tehran',transactionType:'sale',propertyType:'apartment',area:95,bedrooms:3,price:2500000,status:'pending',latitude:35.7,longitude:51.4,description:'Updated by agency',mediaKeys:[],coverMediaKey:'',note:'Agency QA edit'})});assert.equal(editedProperty.status,200);await editedProperty.arrayBuffer();assert.equal((await db.prepare("SELECT title FROM properties WHERE id='consultant-property'").first()).title,'Agency edited property');assert.equal((await db.prepare("SELECT COUNT(*) total FROM property_status_history WHERE property_id='consultant-property' AND note='Agency QA edit'").first()).total,1);
  const forbiddenPropertyEdit=await request('/api/properties/foreign-property',{method:'PATCH',headers:{cookie:cookies.agency,'content-type':'application/json'},body:'{"title":"Taken over"}'});assert.equal(forbiddenPropertyEdit.status,403);await forbiddenPropertyEdit.arrayBuffer();
  const agencyMediaForm=new FormData();agencyMediaForm.append('file',new Blob([Uint8Array.from([255,216,255,217])],{type:'image/jpeg'}),'agency.jpg');
  const agencyUpload=await request('/api/property-media',{method:'POST',headers:{cookie:cookies.agency},body:agencyMediaForm});assert.equal(agencyUpload.status,201);const agencyMedia=(await agencyUpload.json()).item;
  const agencyPropertyCreated=await request('/api/properties',{method:'POST',headers:{cookie:cookies.agency,'content-type':'application/json'},body:JSON.stringify({title:'Agency media property',address:'Agency media address',transactionType:'sale',propertyType:'apartment',area:85,bedrooms:2,price:6000000,latitude:35.7,longitude:51.4,mediaKeys:[agencyMedia.key]})});assert.equal(agencyPropertyCreated.status,201);const agencyPropertyId=(await agencyPropertyCreated.json()).id;
  const agencyPropertyAssigned=await request('/api/agency/workspace',{method:'POST',headers:{cookie:cookies.agency,'content-type':'application/json'},body:JSON.stringify({resource:'assign-property',payload:{propertyId:agencyPropertyId,consultantAccountId:'consultant'}})});assert.equal(agencyPropertyAssigned.status,200);await agencyPropertyAssigned.arrayBuffer();
  const agencyPropertyApproved=await request(`/api/properties/${agencyPropertyId}`,{method:'PATCH',headers:{cookie:cookies.admin,'content-type':'application/json'},body:'{"status":"published"}'});assert.equal(agencyPropertyApproved.status,200);await agencyPropertyApproved.arrayBuffer();
  const consultantManagedProperty=await request(`/api/properties/${agencyPropertyId}`,{headers:{cookie:cookies.consultant}});assert.equal(consultantManagedProperty.status,200);assert.equal((await consultantManagedProperty.json()).media.length,1);
  const consultantManagedMedia=await request(`/api/property-media?key=${encodeURIComponent(agencyMedia.key)}`,{headers:{cookie:cookies.consultant}});assert.equal(consultantManagedMedia.status,200);assert.equal((await consultantManagedMedia.arrayBuffer()).byteLength,4);
  const consultantDeletedMedia=await request(`/api/property-media?key=${encodeURIComponent(agencyMedia.key)}`,{method:'DELETE',headers:{cookie:cookies.consultant}});assert.equal(consultantDeletedMedia.status,200);assert.equal((await consultantDeletedMedia.json()).status,'pending');assert.equal((await db.prepare('SELECT status FROM properties WHERE id=?').bind(agencyPropertyId).first()).status,'pending');assert.equal((await db.prepare("SELECT COUNT(*) total FROM audit_logs WHERE action='property_media.deleted' AND entity_id=?").bind((await db.prepare('SELECT id FROM property_media WHERE object_key=?').bind(agencyMedia.key).first()).id).first()).total,1);
  const leadCreated=await request('/api/agency/workspace',{method:'POST',headers:{cookie:cookies.agency,'content-type':'application/json'},body:JSON.stringify({resource:'leads',payload:{name:'Agency lead',mobile:'09127777777',request:'Apartment in district 13',status:'new'}})});assert.equal(leadCreated.status,200);const agencyLeadId=(await leadCreated.json()).id;
  const leadEditedByAgency=await request('/api/agency/workspace',{method:'POST',headers:{cookie:cookies.agency,'content-type':'application/json'},body:JSON.stringify({resource:'leads',payload:{id:agencyLeadId,name:'Agency lead',mobile:'09127777777',request:'Updated request',status:'contacted'}})});assert.equal(leadEditedByAgency.status,200);await leadEditedByAgency.arrayBuffer();assert.equal((await db.prepare('SELECT status FROM leads WHERE id=?').bind(agencyLeadId).first()).status,'contacted');
  const foreignLeadEdit=await request('/api/agency/workspace',{method:'POST',headers:{cookie:cookies.agency,'content-type':'application/json'},body:JSON.stringify({resource:'leads',payload:{id:'foreign-lead',name:'Taken over',mobile:'09127777777',request:'No',status:'won'}})});assert.equal(foreignLeadEdit.status,404);await foreignLeadEdit.arrayBuffer();
  const leadDeletedByAgency=await request(`/api/agency/workspace?resource=leads&id=${encodeURIComponent(agencyLeadId)}`,{method:'DELETE',headers:{cookie:cookies.agency}});assert.equal(leadDeletedByAgency.status,200);await leadDeletedByAgency.arrayBuffer();
  const contractSigning=new Date(Date.now()+48*60*60_000).toISOString();
  const contractCreated=await request('/api/agency/workspace',{method:'POST',headers:{cookie:cookies.agency,'content-type':'application/json'},body:JSON.stringify({resource:'contracts',payload:{customerName:'Agency customer',customerMobile:'09120000001',amount:1200000,propertyId:'consultant-property',consultantAccountId:'consultant',signingAt:contractSigning,notes:'Bring identity documents',status:'draft'}})});assert.equal(contractCreated.status,200);const agencyContractId=(await contractCreated.json()).id;assert.equal((await db.prepare("SELECT COUNT(*) total FROM reminders WHERE event_type='contract' AND event_id=? AND status='pending'").bind(agencyContractId).first()).total,2);assert.equal((await db.prepare('SELECT COUNT(*) total FROM conversations WHERE subject=?').bind(`هماهنگی قرارداد ${agencyContractId}`).first()).total,1);
  const userContracts=await request('/api/contracts',{headers:{cookie:cookies.user}});assert.equal(userContracts.status,200);assert.ok((await userContracts.json()).items.some(item=>item.id===agencyContractId));
  const contractForm=new FormData();contractForm.append('contractId',agencyContractId);contractForm.append('file',new Blob([Uint8Array.from([37,80,68,70])],{type:'application/pdf'}),'agreement.pdf');
  const contractUpload=await request('/api/contract-documents',{method:'POST',headers:{cookie:cookies.user},body:contractForm});assert.equal(contractUpload.status,201);const contractDocument=(await contractUpload.json()).item;
  const contractDocuments=await request(`/api/contract-documents?contractId=${encodeURIComponent(agencyContractId)}`,{headers:{cookie:cookies.consultant}});assert.equal(contractDocuments.status,200);assert.ok((await contractDocuments.json()).items.some(item=>item.key===contractDocument.key));
  const contractDocumentBytes=await request(`/api/contract-documents?key=${encodeURIComponent(contractDocument.key)}`,{headers:{cookie:cookies.user}});assert.equal(contractDocumentBytes.status,200);assert.equal((await contractDocumentBytes.arrayBuffer()).byteLength,4);
  const contractEdited=await request('/api/agency/workspace',{method:'POST',headers:{cookie:cookies.agency,'content-type':'application/json'},body:JSON.stringify({resource:'contracts',payload:{id:agencyContractId,customerName:'Agency customer',customerMobile:'09120000001',amount:1500000,propertyId:'consultant-property',consultantAccountId:'consultant',signingAt:contractSigning,notes:'Updated documents',status:'review'}})});assert.equal(contractEdited.status,200);await contractEdited.arrayBuffer();assert.equal((await db.prepare('SELECT amount FROM contracts WHERE id=?').bind(agencyContractId).first()).amount,1500000);assert.equal((await db.prepare('SELECT COUNT(*) total FROM conversations WHERE subject=?').bind(`هماهنگی قرارداد ${agencyContractId}`).first()).total,1);
  const foreignContractEdit=await request('/api/agency/workspace',{method:'POST',headers:{cookie:cookies.agency,'content-type':'application/json'},body:JSON.stringify({resource:'contracts',payload:{id:'foreign-contract',customerName:'Taken over',amount:1,status:'completed'}})});assert.equal(foreignContractEdit.status,404);await foreignContractEdit.arrayBuffer();
  const contractDeleted=await request(`/api/agency/workspace?resource=contracts&id=${encodeURIComponent(agencyContractId)}`,{method:'DELETE',headers:{cookie:cookies.agency}});assert.equal(contractDeleted.status,200);await contractDeleted.arrayBuffer();
  const saveIntegration=(url)=>request('/api/admin/integrations',{method:'POST',headers:{cookie:cookies.admin,'content-type':'application/json'},body:JSON.stringify({category:'sms',provider:'test',enabled:false,publicConfig:{baseUrl:url},secret:'short-test-secret'})});
  for(const url of ['https://127.0.0.1','http://api.vendor.example','https://unapproved.example']){
   const r=await saveIntegration(url);assert.equal(r.status,400);await r.arrayBuffer();
  }
  const saved=await saveIntegration('https://api.vendor.example/send');assert.equal(saved.status,200);assert.equal((await saved.text()).includes('short-test-secret'),false);
  const integrations=await request('/api/admin/integrations',{headers:{cookie:cookies.admin}});const integrationText=await integrations.text();assert.equal(integrationText.includes('short-test-secret'),false);assert.equal(integrationText.includes('encryptedSecret'),false);
  const malformed=await request('/api/admin/finance',{headers:{cookie:'hatam_session=%ZZ'}});assert.equal(malformed.status,403);await malformed.arrayBuffer();
  for(const path of ['/api/admin/finance','/api/auth/set-password','/api/auth/logout','/api/auth/password-login','/api/auth/request-otp','/api/auth/verify-otp']){
   const cross=await request(path,{method:path==='/api/admin/finance'?'PATCH':'POST',headers:{cookie:cookies.admin,origin:'https://untrusted.example','content-type':'application/json'},body:'{}'});
   assert.ok([401,403].includes(cross.status),`${path} rejects foreign Origin: ${cross.status}`);await cross.arrayBuffer();
  }
  const wallet=await request('/api/wallet',{headers:{cookie:cookies.user}});assert.equal(wallet.status,200);assert.equal((await wallet.json()).wallet.balance,0);
  const form=new FormData();form.append('file',new Blob([Uint8Array.from([255,216,255,217])],{type:'image/jpeg'}),'test.jpg');
  const uploaded=await request('/api/property-media',{method:'POST',headers:{cookie:cookies.user},body:form});assert.equal(uploaded.status,201);const media=(await uploaded.json()).item;
  const propertyCreated=await request('/api/properties',{method:'POST',headers:{cookie:cookies.user,'content-type':'application/json'},body:JSON.stringify({title:'QA property',address:'QA address',transactionType:'sale',area:80,bedrooms:2,price:5000000,latitude:35.7,longitude:51.4,mediaKeys:[media.key],description:JSON.stringify({internalPrice:'PRIVATE_PRICE',amenities:['پارکینگ']})})});assert.equal(propertyCreated.status,201);const propertyId=(await propertyCreated.json()).id;
  const anonymous=await request(`/api/properties/${propertyId}`);assert.equal(anonymous.status,404);await anonymous.arrayBuffer();
  const approved=await request(`/api/properties/${propertyId}`,{method:'PATCH',headers:{cookie:cookies.admin,'content-type':'application/json'},body:'{"status":"published"}'});assert.equal(approved.status,200);await approved.arrayBuffer();
  const published=await request(`/api/properties/${propertyId}`);assert.equal(published.status,200);assert.equal((await published.text()).includes('PRIVATE_PRICE'),false);
  const listing=await request('/api/properties');const listingBody=await listing.json();assert.ok(listingBody.items.some(x=>x.id===propertyId));assert.equal(JSON.stringify(listingBody).includes('PRIVATE_PRICE'),false);
  const publicMedia=await request(`/api/property-media?key=${encodeURIComponent(media.key)}`);assert.equal(publicMedia.status,200);assert.equal((await publicMedia.arrayBuffer()).byteLength,4);
  const filtered=await request('/api/properties?minPrice=4000000&maxPrice=6000000&minArea=70&maxArea=90&beds=2&amenities=%D9%BE%D8%A7%D8%B1%DA%A9%DB%8C%D9%86%DA%AF');assert.equal(filtered.status,200);assert.ok((await filtered.json()).items.some(item=>item.id===propertyId));
  const excluded=await request('/api/properties?minPrice=7000000');assert.equal(excluded.status,200);assert.ok(!(await excluded.json()).items.some(item=>item.id===propertyId));
  const urgentForm=new FormData();urgentForm.append('file',new Blob([Uint8Array.from([255,216,255,217])],{type:'image/jpeg'}),'urgent.jpg');
  const urgentUpload=await request('/api/property-media',{method:'POST',headers:{cookie:cookies.user},body:urgentForm});assert.equal(urgentUpload.status,201);const urgentMedia=(await urgentUpload.json()).item;
  const urgentCreated=await request('/api/urgent-sales',{method:'POST',headers:{cookie:cookies.user,'content-type':'application/json'},body:JSON.stringify({firstName:'Test',lastName:'Owner',mobile:'09120000001',address:'Tehran district 13',latitude:35.7,longitude:51.4,area:80,bedrooms:2,buildingAge:1400,expectedPrice:5000000,mediaKeys:[urgentMedia.key]})});assert.equal(urgentCreated.status,201,await urgentCreated.clone().text());const urgentId=(await urgentCreated.json()).id;
  assert.equal((await db.prepare('SELECT urgent_sale_id id FROM property_media WHERE object_key=?').bind(urgentMedia.key).first()).id,urgentId);
  const adminUrgent=await request('/api/urgent-sales',{headers:{cookie:cookies.admin}});assert.equal(adminUrgent.status,200);assert.equal((await adminUrgent.json()).items.find(item=>item.id===urgentId)?.media[0]?.key,urgentMedia.key);
  const unassignedMedia=await request(`/api/property-media?key=${encodeURIComponent(urgentMedia.key)}`,{headers:{cookie:cookies.consultant}});assert.equal(unassignedMedia.status,403);await unassignedMedia.arrayBuffer();
  const assignedUrgent=await request('/api/urgent-sales',{method:'PATCH',headers:{cookie:cookies.admin,'content-type':'application/json'},body:JSON.stringify({id:urgentId,assignedConsultantId:'consultant',assignedConsultantName:'Test',consultantAccess:'view',status:'assigned'})});assert.equal(assignedUrgent.status,200);await assignedUrgent.arrayBuffer();
  const assignedMedia=await request(`/api/property-media?key=${encodeURIComponent(urgentMedia.key)}`,{headers:{cookie:cookies.consultant}});assert.equal(assignedMedia.status,200);await assignedMedia.arrayBuffer();
  const reusedUrgentMedia=await request('/api/properties',{method:'POST',headers:{cookie:cookies.user,'content-type':'application/json'},body:JSON.stringify({title:'Invalid reused media',address:'Tehran district 13',transactionType:'sale',area:80,price:5000000,latitude:35.7,longitude:51.4,mediaKeys:[urgentMedia.key]})});assert.equal(reusedUrgentMedia.status,403);await reusedUrgentMedia.arrayBuffer();
  assert.equal((await db.prepare("SELECT COUNT(*) total FROM audit_logs WHERE action='urgent_sale.created' AND entity_id=?").bind(urgentId).first()).total,1);
  const created=await request('/api/chat',{method:'POST',headers:{cookie:cookies.user,'content-type':'application/json'},body:JSON.stringify({action:'create',participantAccountIds:['agency'],subject:'Private test'})});
  assert.equal(created.status,201);const conversationId=(await created.json()).id;
  // Observe both SSE channels before sending; a durable message must trigger both.
  const streams=[];
  try{
   for(const path of [`/api/chat/stream?conversationId=${conversationId}`,'/api/notifications/stream']){
    const controller=new AbortController();const response=await request(path,{headers:{cookie:cookies.agency},signal:controller.signal});assert.equal(response.status,200);
    const reader=response.body.getReader();streams.push({controller,reader});const initial=await reader.read();assert.match(new TextDecoder().decode(initial.value),/event: ready/);
   }
   const sent=await request('/api/chat',{method:'POST',headers:{cookie:cookies.user,'content-type':'application/json'},body:JSON.stringify({conversationId,body:'Realtime test'})});assert.equal(sent.status,201);await sent.arrayBuffer();
   for(const [index,stream] of streams.entries()){
    let timer;const event=await Promise.race([stream.reader.read(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('SSE update timeout')),5000)})]).finally(()=>clearTimeout(timer));
    assert.match(new TextDecoder().decode(event.value),index===0?/event: message/:/event: notification/);
   }
  }finally{for(const stream of streams){await stream.reader.cancel();stream.controller.abort()}}
  for(const role of ['user','agency','admin','consultant']){
   const r=await request(`/api/chat?conversationId=${conversationId}`,{headers:{cookie:cookies[role]}});assert.equal(r.status,role==='consultant'?403:200);await r.arrayBuffer();
  }
  const unwanted=await request('/api/chat',{method:'POST',headers:{cookie:cookies.consultant,'content-type':'application/json'},body:JSON.stringify({conversationId,body:'Unauthorized'})});assert.equal(unwanted.status,403);await unwanted.arrayBuffer();
  await db.prepare("INSERT INTO property_media(id,object_key,owner_account_id,file_name,content_type,size,status,created_at,updated_at) VALUES ('private-media','properties/user/private.jpg','user','private.jpg','image/jpeg',10,'active',?,?)").bind(Date.now(),Date.now()).run();
  const privateMedia=await request('/api/property-media?key=properties%2Fuser%2Fprivate.jpg',{headers:{cookie:cookies.consultant}});assert.equal(privateMedia.status,403);await privateMedia.arrayBuffer();
  for(const role of ['user','consultant','agency']){
   const r=await request('/api/admin/finance',{headers:{cookie:cookies[role]}});assert.equal(r.status,403);await r.arrayBuffer();
  }
  // Sharing an agency must not grant a consultant access to a colleague's file.
  for(const [path,method,expected] of [['/api/properties/private','GET',404],['/api/properties/private','PATCH',403],['/api/properties/private/history','GET',403]]){
   const r=await request(path,{method,headers:{cookie:cookies.consultant,'content-type':'application/json'},...(method==='PATCH'?{body:'{}'}:{})});assert.equal(r.status,expected,`${method} ${path}`);await r.arrayBuffer();
  }
  for(const role of ['user','agency','admin']){
   const r=await request('/api/properties/private',{headers:{cookie:cookies[role]}});assert.equal(r.status,200,role);await r.arrayBuffer();
  }
  // An existing session loses operational access as soon as the account is disabled.
  for(const status of ['pending','suspended','rejected']){
   await db.prepare('UPDATE accounts SET status=? WHERE id=?').bind(status,'user').run();
   for(const path of ['/api/chat','/api/notifications','/api/properties?scope=mine','/api/properties/private/history']){
    const r=await request(path,{headers:{cookie:cookies.user}});assert.equal(r.status,401,`${status}: ${path}`);await r.arrayBuffer();
   }
   const session=await request('/api/auth/session',{headers:{cookie:cookies.user}});const body=await session.json();assert.equal(body.account?.status??null,status==='pending'?'pending':null);
   const password=await request('/api/auth/password-status',{headers:{cookie:cookies.user}});assert.equal(password.status,status==='pending'?200:401);await password.arrayBuffer();
   const media=await request('/api/property-media?key=properties%2Fuser%2Fprivate.jpg',{headers:{cookie:cookies.user}});assert.equal(media.status,403);await media.arrayBuffer();
  }
  await db.prepare("UPDATE accounts SET status='active' WHERE id='user'").run();
  const restored=await request('/api/notifications',{headers:{cookie:cookies.user}});assert.equal(restored.status,200);await restored.arrayBuffer();
  const seedOtp=async(id,mobile,expiresAt=Date.now()+60000)=>{
   const hash=createHash('sha256').update(`${process.env.AUTH_SECRET}:${id}:1234`).digest('hex');
   await db.prepare("INSERT INTO otp_challenges(id,mobile,role,code_hash,attempts,expires_at,created_at) VALUES (?,?,'user',?,0,?,?)").bind(id,mobile,hash,expiresAt,Date.now()).run();
  };
  const verify=(id,mobile,code='1234')=>request('/api/auth/verify-otp',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({challengeId:id,mobile,code,role:'user',mode:'login'})});
  for(const path of ['/api/auth/request-otp','/api/auth/password-login']){
   const malformed=await request(path,{method:'POST',headers:{'content-type':'application/json'},body:'{'});assert.equal(malformed.status,400,`${path} rejects malformed JSON`);await malformed.arrayBuffer();
  }
  for(const payload of ['{','null','[]',JSON.stringify({mobile:1234}),JSON.stringify({mobile:'09120000001',challengeId:'x',role:'constructor',mode:'login',code:'1234'})]){
   const r=await request('/api/auth/verify-otp',{method:'POST',headers:{'content-type':'application/json'},body:payload});assert.equal(r.status,400);await r.arrayBuffer();
  }
  await seedOtp('race','09120000001');
  const raced=await Promise.all([verify('race','09120000001'),verify('race','09120000001')]);
  assert.deepEqual(raced.map(r=>r.status).sort(),[200,400],'OTP must issue only one session');
  assert.equal(raced.filter(r=>r.headers.has('set-cookie')).length,1);
  await Promise.all(raced.map(r=>r.arrayBuffer()));
  await seedOtp('persian-digits','09120000001');
  const persianDigits=await verify('persian-digits','۰۹۱۲۰۰۰۰۰۰۱','۱۲۳۴');assert.equal(persianDigits.status,200);await persianDigits.arrayBuffer();
  const replay=await verify('race','09120000001');assert.equal(replay.status,400);assert.equal(replay.headers.has('set-cookie'),false);await replay.arrayBuffer();
  await seedOtp('wrong-attempts','09122222222');
  const wrong=await Promise.all(Array.from({length:5},()=>verify('wrong-attempts','09122222222','0000')));
  await Promise.all(wrong.map(r=>r.arrayBuffer()));
  const attemptCount=await db.prepare("SELECT attempts FROM otp_challenges WHERE id='wrong-attempts'").first();assert.equal(attemptCount.attempts,5);
  const locked=await verify('wrong-attempts','09122222222');assert.equal(locked.status,429);await locked.arrayBuffer();
  await seedOtp('expired','09123333333',Date.now()-1000);
  const expired=await verify('expired','09123333333');assert.equal(expired.status,400);await expired.arrayBuffer();
  await db.prepare("UPDATE accounts SET status='suspended' WHERE id='user'").run();
  await seedOtp('blocked','09120000001');
  const blocked=await verify('blocked','09120000001');assert.equal(blocked.status,403);assert.equal(blocked.headers.has('set-cookie'),false);await blocked.arrayBuffer();
 }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));db.close();}
 // The imported production bundle owns a SQLite handle until process exit.
 // Temporary fixture directory is intentionally retained for failure inspection.
});
