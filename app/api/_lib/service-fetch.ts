import {env} from "cloudflare:workers";
import {fetchService,serviceUrl} from "./service-url";

function hosts(){return (env as unknown as Record<string,string|undefined>).INTEGRATION_ALLOWED_HOSTS||""}
export function validateServiceUrl(value:string){return serviceUrl(value,hosts())}
export function serviceFetch(value:string,init:RequestInit){return fetchService(value,init,hosts())}
