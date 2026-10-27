export function mobileHomeDestination(userAgent:string,hostname:string,search:string){
 if(new URLSearchParams(search).get('site')==='1')return null;
 if(!/Android.*Mobile|iPhone|iPod/i.test(userAgent))return null;
 return ['localhost','127.0.0.1'].includes(hostname)?'/app':'https://web.hatamestate.com/app';
}
