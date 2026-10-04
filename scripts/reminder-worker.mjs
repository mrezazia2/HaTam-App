const secret=process.env.AUTOMATION_SECRET;
if(!secret||secret.length<32)throw new Error('AUTOMATION_SECRET is required');
if(process.env.HATAM_PRESENTATION_MODE)throw new Error('Reminders disabled in presentation mode');
const origin=process.env.HATAM_INTERNAL_ORIGIN||'http://127.0.0.1:3000';
let stopping=false;
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{stopping=true;});
while(!stopping){
  try {
    const response=await fetch(new URL('/api/system/process-communications',origin),{method:'POST',headers:{authorization:`Bearer ${secret}`},signal:AbortSignal.timeout(55000)});
    console.log(JSON.stringify({event:'reminder_run',status:response.status,time:new Date().toISOString()}));
    await response.arrayBuffer();
  }catch{console.error('Reminder processing failed; next attempt in 60 seconds');}
  for(let i=0;i<60&&!stopping;i++)await new Promise(resolve=>setTimeout(resolve,1000));
}
