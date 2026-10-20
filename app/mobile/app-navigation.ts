/** Same-document navigation preserves the installed app's history and splash. */
export function navigateApp(target:string){
 const url=new URL(target,window.location.href);
 if(url.origin!==location.origin||url.pathname!=='/app'){location.assign(url.href);return}
 if(url.href===location.href)return;
 window.history.pushState({hatamPrevious:location.href},'',url);
 window.dispatchEvent(new PopStateEvent('popstate'));
}
