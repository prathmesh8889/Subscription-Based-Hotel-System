import React,{useEffect,useState}from'react';
import{useNavigate}from'react-router-dom';
import{api}from'../../services/api';
import{Settings,Save,CheckCircle2,KeyRound,Lock}from'lucide-react';

export function AdminSettingsPage(){
  const nav=useNavigate();
  const[alerts,setAlerts]=useState(true);
  const[autoRefresh,setAutoRefresh]=useState(true);
  const[compact,setCompact]=useState(false);
  const[saved,setSaved]=useState(false);
  const[status,setStatus]=useState<any>(null);
  const[form,setForm]=useState({currentPassword:'',newEmail:'',newPassword:'',confirmPassword:''});
  const[error,setError]=useState('');
  const[message,setMessage]=useState('');
  const[changing,setChanging]=useState(false);

  useEffect(()=>{
    const raw=localStorage.getItem('platform_preferences');
    if(raw){
      const p=JSON.parse(raw);
      setAlerts(p.alerts??true);setAutoRefresh(p.autoRefresh??true);setCompact(p.compact??false);
    }
    api<any>('/platform/credentials/status').then(r=>{
      setStatus(r.data);
      setForm(f=>({...f,newEmail:r.data.currentEmail||''}));
    }).catch(e=>setError(e.message));
  },[]);

  const save=()=>{
    localStorage.setItem('platform_preferences',JSON.stringify({alerts,autoRefresh,compact}));
    setSaved(true);setTimeout(()=>setSaved(false),2000);
  };

  const changeCredentials=async(e:React.FormEvent)=>{
    e.preventDefault();setError('');setMessage('');
    if(form.newPassword!==form.confirmPassword){setError('New password and confirmation do not match.');return}
    setChanging(true);
    try{
      const r=await api<any>('/platform/credentials/change',{method:'POST',body:JSON.stringify({currentPassword:form.currentPassword,newEmail:form.newEmail,newPassword:form.newPassword})});
      setMessage(r.message||'Credentials changed successfully.');
      setTimeout(()=>nav('/platform/login',{replace:true}),1200);
    }catch(e:any){setError(e.message)}
    finally{setChanging(false)}
  };

  return <div className="space-y-4 sm:space-y-6 max-w-4xl min-w-0">
    <div><h1 className="text-2xl font-bold">Platform Settings</h1><p className="text-sm text-gray-500">Admin security and dashboard preferences.</p></div>
    {error&&<div className="p-3 bg-red-50 text-red-700 rounded-lg">{error}</div>}
    {message&&<div className="p-3 bg-green-50 text-green-700 rounded-lg flex gap-2"><CheckCircle2 size={18}/>{message}</div>}

    <div className="bg-white border rounded-xl p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-4"><KeyRound className="text-purple-600"/><h2 className="font-semibold">Admin Login ID & Password</h2></div>
      {!status?<p className="text-sm text-gray-500">Loading credential settings...</p>:status.canChange?
      <form onSubmit={changeCredentials} className="space-y-3">
        <div className="p-3 bg-amber-50 text-amber-800 rounded-lg text-sm"><b>One-time change:</b> after saving the new login ID/email and password, this option will be permanently locked.</div>
        <input required type="password" className="w-full border rounded-lg p-3" placeholder="Current password" value={form.currentPassword} onChange={e=>setForm({...form,currentPassword:e.target.value})}/>
        <input required type="email" className="w-full border rounded-lg p-3" placeholder="New login email / ID" value={form.newEmail} onChange={e=>setForm({...form,newEmail:e.target.value})}/>
        <input required minLength={10} type="password" className="w-full border rounded-lg p-3" placeholder="New password (10+ characters)" value={form.newPassword} onChange={e=>setForm({...form,newPassword:e.target.value})}/>
        <input required minLength={10} type="password" className="w-full border rounded-lg p-3" placeholder="Confirm new password" value={form.confirmPassword} onChange={e=>setForm({...form,confirmPassword:e.target.value})}/>
        <button disabled={changing} className="w-full sm:w-auto bg-purple-600 text-white rounded-lg px-5 py-3 font-medium">{changing?'Updating...':'Change Login ID + Password Once'}</button>
      </form>:
      <div className="p-4 bg-gray-50 rounded-lg flex flex-col sm:flex-row gap-3 min-w-0"><Lock className="text-gray-500"/><div><p className="font-medium">Credential change already used</p><p className="text-sm text-gray-500">This one-time security option is now locked{status.changedAt?' since '+new Date(status.changedAt).toLocaleString():''}.</p><p className="text-sm mt-2">Current login ID: <b>{status.currentEmail}</b></p></div></div>}
    </div>

    <div className="bg-white border rounded-xl p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-5"><Settings className="text-purple-600"/><h2 className="font-semibold">Dashboard Preferences</h2></div>
      {[
        ['Subscription alerts','Show expiry and inactive-hotel alerts',alerts,setAlerts],
        ['Auto refresh','Keep dashboard information fresh',autoRefresh,setAutoRefresh],
        ['Compact view','Use tighter cards and tables',compact,setCompact],
      ].map(([title,desc,value,setValue]:any)=><div key={title} className="flex items-center justify-between gap-4 py-4 border-b last:border-0"><div><p className="font-medium">{title}</p><p className="text-sm text-gray-500">{desc}</p></div><button type="button" onClick={()=>setValue(!value)} className={"w-12 h-7 rounded-full p-1 transition "+(value?'bg-purple-600':'bg-gray-300')}><span className={"block w-5 h-5 bg-white rounded-full transition-transform "+(value?'translate-x-5':'')}/></button></div>)}
      <button onClick={save} className="mt-5 w-full sm:w-auto px-5 py-2.5 bg-purple-600 text-white rounded-lg flex items-center justify-center gap-2"><Save size={17}/>Save Settings</button>
      {saved&&<p className="text-sm text-green-600 mt-3">Settings saved.</p>}
    </div>
  </div>
}
