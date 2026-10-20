import test from 'node:test';
import assert from 'node:assert/strict';
import {navigateApp} from '../app/mobile/app-navigation.ts';
test('consultant -> inventory -> property retains previous URL without page reload',()=>{
 const original={window:globalThis.window,location:globalThis.location,PopStateEvent:globalThis.PopStateEvent};
 const stack=[];let current='https://web.hatamestate.com/app?screen=consultants',reloads=0,events=0;
 const location={get href(){return current},get origin(){return new URL(current).origin},assign(){reloads++}};
 globalThis.location=location;
 globalThis.PopStateEvent=class{constructor(type){this.type=type}};
 globalThis.window={location,history:{pushState(state,_,url){stack.push(state);current=String(url)}},dispatchEvent(){events++}};
 try{
  navigateApp('/app?screen=consultant-properties&consultantId=test');
  navigateApp('/app?screen=detail&propertyId=test');
  assert.equal(reloads,0);assert.equal(events,2);
  assert.equal(stack[0].hatamPrevious,'https://web.hatamestate.com/app?screen=consultants');
  assert.match(stack[1].hatamPrevious,/consultant-properties&consultantId=test/);
  navigateApp(current);assert.equal(events,2);
 }finally{for(const [key,value] of Object.entries(original)){if(value===undefined)delete globalThis[key];else globalThis[key]=value}}
});
