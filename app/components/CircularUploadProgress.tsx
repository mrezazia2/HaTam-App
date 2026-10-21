import type {UploadProgress} from './upload-progress';
import './circular-upload-progress.css';

export default function CircularUploadProgress({percent,state}:UploadProgress){
 const value=Math.max(0,Math.min(100,Math.round(percent)));
 const label=state==='complete'?'آپلود کامل':state==='failed'?'آپلود ناموفق':state==='staged'?'آماده ارسال':`آپلود ${value.toLocaleString('fa-IR')} درصد`;
 return <span className={`circular-upload ${state}`} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}>
  <svg viewBox="0 0 48 48" aria-hidden="true"><circle className="upload-ring-track" cx="24" cy="24" r="20"/><circle className="upload-ring-fill" cx="24" cy="24" r="20" pathLength="100" strokeDasharray="100" strokeDashoffset={100-value}/></svg>
  <b aria-hidden="true">{state==='complete'?'✓':state==='failed'?'×':`${value.toLocaleString('fa-IR')}٪`}</b>
 </span>;
}
