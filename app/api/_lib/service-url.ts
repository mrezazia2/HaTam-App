// The operator approves exact provider hosts, independently of editable admin URLs.
// No wildcard/suffix matches: api.vendor.test.evil must never inherit trust.
export function serviceUrl(value:string, approvedHosts:string) {
 let url:URL;try{url=new URL(value)}catch{throw new Error("SERVICE_URL_INVALID")}
 const host=url.hostname.toLowerCase();
 if(url.protocol!=="https:"||url.username||url.password||url.hash||(url.port&&url.port!=="443"))throw new Error("SERVICE_URL_UNSAFE");
 if(!host.includes(".")||host.endsWith(".")||host.includes(":")||/^\d+(\.\d+)*$/.test(host)||/(^|\.)(localhost|local|internal|test|invalid)$/.test(host))throw new Error("SERVICE_HOST_UNSAFE");
 const hosts=approvedHosts.split(",").map(x=>x.trim().toLowerCase()).filter(Boolean);
 if(!hosts.includes(host))throw new Error("SERVICE_HOST_NOT_APPROVED");
 return url.toString();
}

export async function fetchService(value:string,init:RequestInit,approvedHosts:string,send:typeof fetch=fetch) {
 const url=serviceUrl(value,approvedHosts);
 // Redirects could move credentials to an unapproved destination.
 const response=await send(url,{...init,signal:init.signal||AbortSignal.timeout(30_000),redirect:"error"});
 if(response.status>=300&&response.status<400)throw new Error("SERVICE_REDIRECT_BLOCKED");
 return response;
}
