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
 let response:Awaited<ReturnType<typeof startRegistration>>;
 try{response=await startRegistration({optionsJSON:start.options})}catch(error){
  const name=error instanceof Error?error.name:"Other";
  const code=error&&typeof error==="object"&&"code" in error?String(error.code):"Other";
  try{await postPasskey("/api/auth/passkeys/register",{action:"client-error",challengeId:start.challengeId,name,code})}catch{}
  throw error;
 }
 return postPasskey("/api/auth/passkeys/register",{action:"finish",challengeId:start.challengeId,response,label});
}

export async function signInWithPasskey(mobile:string,role:"user"|"consultant"|"agency",surface?:"app"){
 if(!passkeySupported())throw new Error("PASSKEY_UNSUPPORTED");
 const {startAuthentication}=await import("@simplewebauthn/browser");
 const start=await postPasskey("/api/auth/passkeys/login",{action:"begin",mobile,role});
 const response=await startAuthentication({optionsJSON:start.options});
 return postPasskey("/api/auth/passkeys/login",{action:"finish",challengeId:start.challengeId,response,surface});
}

export function passkeyMessage(error:unknown){
 const code=error instanceof Error?error.message:"";
 const name=error instanceof Error?error.name:"";
 const browserCode=error&&typeof error==="object"&&"code" in error?String(error.code):"";
 if(code==="PASSKEY_UNSUPPORTED")return "این مرورگر یا دستگاه از ورود با قفل دستگاه پشتیبانی نمی‌کند؛ از پیامک یا رمز استفاده کنید.";
 if(code==="PASSKEY_NOT_AVAILABLE")return "برای این حساب هنوز کلید عبور فعال نشده است؛ ابتدا با پیامک وارد شوید و آن را فعال کنید.";
 if(code==="TOO_MANY_ATTEMPTS")return "تلاش‌های ورود زیاد بوده است؛ کمی بعد دوباره امتحان کنید.";
 if(code==="PASSKEY_CHALLENGE_EXPIRED")return "زمان ساخت کلید به پایان رسیده است؛ دوباره تلاش کنید.";
 if(code==="PASSKEY_VERIFICATION_FAILED")return "کلید ساخته شد اما تأیید امنیتی آن در سرور ناموفق بود؛ دوباره تلاش کنید.";
 if(code==="AUTH_REQUIRED")return "نشست ورود شما پایان یافته است؛ یک‌بار دیگر با پیامک وارد شوید.";
 if(name==="NotAllowedError")return "گوشی یا مدیر گذرواژه ساخت کلید را تکمیل نکرد (NotAllowedError). صفحه را مستقیم در Chrome باز کنید و فعال بودن قفل صفحه و Google Password Manager را بررسی کنید؛ ورود پیامکی و رمز همچنان کار می‌کنند.";
 if(name==="InvalidStateError"||browserCode==="ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED"||code==="PASSKEY_ALREADY_REGISTERED")return "این دستگاه قبلاً برای حساب شما ثبت شده است.";
 if(name==="SecurityError"||browserCode==="ERROR_INVALID_RP_ID")return "دامنهٔ این صفحه برای ساخت کلید پذیرفته نشد (SecurityError)؛ صفحه را مستقیم از دامنهٔ حاتم در Chrome باز کنید.";
 if(name==="NotSupportedError"||browserCode==="ERROR_AUTHENTICATOR_NO_SUPPORTED_PUBKEYCREDPARAMS_ALG")return "مرورگر یا مدیر گذرواژهٔ گوشی از این نوع کلید پشتیبانی نمی‌کند (NotSupportedError).";
 if(name==="UnknownError"||browserCode==="ERROR_AUTHENTICATOR_GENERAL_ERROR")return "مدیر گذرواژهٔ گوشی نتوانست کلید را بسازد (UnknownError). Chrome و سرویس‌های Google Play را به‌روز کنید.";
 if(name==="AbortError"||browserCode==="ERROR_CEREMONY_ABORTED")return "فرایند ساخت کلید متوقف شد؛ دوباره تلاش کنید.";
 return "عملیات قفل دستگاه انجام نشد؛ دوباره تلاش کنید یا از پیامک و رمز استفاده کنید.";
}
