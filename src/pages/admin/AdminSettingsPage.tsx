import React,{useEffect,useState}from'react';
import{Settings,Save,CheckCircle2}from'lucide-react';

export function AdminSettingsPage(){
  const[alerts,setAlerts]=useState(true);
  const[autoRefresh,setAutoRefresh]=useState(true);
  const[compact,setCompact]=useState(false);
  const[saved,setSaved]=useState(false);

  useEffect(()=>{
    const raw=localStorage.getItem('platform_preferences');
    if(raw){
      const p=JSON.parse(raw);
      setAlerts(p.alerts??true);setAutoRefresh(p.autoRefresh??true);setCompact(p.compact??false);
    }
  },[]);

  const save=()=>{
    localStorage.setItem('platform_preferences',JSON.stringify({alerts,autoRefresh,compact}));
    setSaved(true);setTimeout(()=>setSaved(false),2000);
  };

  return <div className="space-y-6 max-w-4xl">
    <div><h1 className="text-2xl font-bold">Platform Settings</h1><p className="text-sm text-gray-500">Control admin dashboard preferences.</p></div>
    {saved&&<div className="p-3 bg-green-50 text-green-700 rounded-lg flex gap-2"><CheckCircle2 size={18}/>Settings saved.</div>}
    <div className="bg-white border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-5"><Settings className="text-purple-600"/><h2 className="font-semibold">Dashboard Preferences</h2></div>
      {[
        ['Subscription alerts','Show expiry and inactive-hotel alerts',alerts,setAlerts],
        ['Auto refresh','Keep dashboard information fresh',autoRefresh,setAutoRefresh],
        ['Compact view','Use tighter cards and tables',compact,setCompact],
      ].map(([title,desc,value,setValue]:any)=><div key={title} className="flex items-center justify-between py-4 border-b last:border-0"><div><p className="font-medium">{title}</p><p className="text-sm text-gray-500">{desc}</p></div><button onClick={()=>setValue(!value)} className={"w-12 h-7 rounded-full p-1 transition "+(value?'bg-purple-600':'bg-gray-300')}><span className={"block w-5 h-5 bg-white rounded-full transition-transform "+(value?'translate-x-5':'')}/></button></div>)}
      <button onClick={save} className="mt-5 px-5 py-2.5 bg-purple-600 text-white rounded-lg flex items-center gap-2"><Save size={17}/>Save Settings</button>
    </div>
    <div className="bg-white border rounded-xl p-5"><h2 className="font-semibold mb-3">Plan Reference</h2><div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">{[['TRIAL','Free'],['STARTER','₹499/mo'],['PRO','₹999/mo'],['BUSINESS','₹1999/mo']].map(p=><div key={p[0]} className="border rounded-lg p-4"><b>{p[0]}</b><p className="text-sm text-purple-600 mt-1">{p[1]}</p></div>)}</div></div>
  </div>
}
