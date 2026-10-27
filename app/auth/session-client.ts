// Check the public session endpoint before requesting private resources.
// Do not cache this result across logins/logouts or share it across accounts.
export async function hasAccountSession(){
 const response=await fetch('/api/auth/session',{cache:'no-store'});
 if(!response.ok)throw Error('SESSION_CHECK_FAILED');
 const result=await response.json();return Boolean(result.account);
}
