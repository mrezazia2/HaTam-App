export function passkeySupported(){return typeof window!=="undefined"&&window.isSecureContext&&typeof window.PublicKeyCredential!=="undefined"}

async function postPasskey(path:string,body:Record<string,unknown>){
 const response=await fetch(path,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
 const result=await response.json();
 if(!response.ok)throw new Error(result.error||"PASSKEY_FAILED");
 return result;
}

export async function enrollPasskey(label="قفل دستگاه"){
 if(!passkeySupported())throw new Error("PASSKEY_UNSUPPORTED");
 const {startRegistration}=await import("@simplewebauthn/browser");
 const start=await postPasskey("/api/auth/passkeys/register",{action:"begin"});
 const response=await startRegistration({optionsJSON:start.options});
 return postPasskey("/api/auth/passkeys/register",{action:"finish",challengeId:start.challengeId,response,label});
}

export async function signInWithPasskey(mobile:string,role:"user"|"consultant"|"agency"){
 if(!passkeySupported())throw new Error("PASSKEY_UNSUPPORTED");
 const {startAuthentication}=await import("@simplewebauthn/browser");
 const start=await postPasskey("/api/auth/passkeys/login",{action:"begin",mobile,role});
 const response=await startAuthentication({optionsJSON:start.options});
 return postPasskey("/api/auth/passkeys/login",{action:"finish",challengeId:start.challengeId,response});
}

export function passkeyMessage(error:unknown){
 const code=error instanceof Error?error.message:"";
 if(code==="PASSKEY_UNSUPPORTED")return "این مرورگر یا دستگاه از ورود با قفل دستگاه پشتیبانی نمی‌کند؛ از پیامک یا رمز استفاده کنید.";
 if(code==="PASSKEY_NOT_AVAILABLE")return "برای این حساب هنوز کلید عبور فعال نشده است؛ ابتدا با پیامک وارد شوید و آن را فعال کنید.";
 if(code==="TOO_MANY_ATTEMPTS")return "تلاش‌های ورود زیاد بوده است؛ کمی بعد دوباره امتحان کنید.";
 if(code==="NotAllowedError")return "تأیید قفل دستگاه لغو شد یا زمان آن به پایان رسید.";
 if(code==="InvalidStateError"||code==="PASSKEY_ALREADY_REGISTERED")return "این دستگاه قبلاً برای حساب شما ثبت شده است.";
 return "عملیات قفل دستگاه انجام نشد؛ دوباره تلاش کنید یا از پیامک و رمز استفاده کنید.";
}
