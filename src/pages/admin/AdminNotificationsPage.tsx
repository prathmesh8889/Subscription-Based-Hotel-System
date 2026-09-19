import React,{useEffect,useState}from'react';
import{useNavigate}from'react-router-dom';
import{api}from'../../services/api';
import{Bell,AlertTriangle,Info,RefreshCw}from'lucide-react';

export function AdminNotificationsPage(){
  const nav=useNavigate();
  const[items,setItems]=useState<any[]>([]);
  const[loading,setLoading]=useState(true);
  const[error,setError]=useState('');

  const load=async()=>{setLoading(true);try{const r=await api<any>('/platform/notifications');setItems(r.data.notifications||[]);setError('')}catch(e:any){setError(e.message)}finally{setLoading(false)}};
  useEffect(()=>{load()},[]);

  return <div className="space-y-5 max-w-4xl">
    <div className="flex items-center justify-between"><div><h1 className="text-2xl font-bold">Notifications</h1><p className="text-sm text-gray-500">Subscription expiry and hotel status alerts.</p></div><button onClick={load} className="px-4 py-2 border rounded-lg flex gap-2 items-center"><RefreshCw size={16}/>Refresh</button></div>
    {error&&<div className="p-3 bg-red-50 text-red-700 rounded-lg">{error}</div>}
    {loading?<div className="p-10 text-center text-gray-500">Loading alerts...</div>:items.length===0?<div className="bg-white border rounded-xl p-10 text-center text-gray-500"><Bell className="mx-auto mb-2 text-green-500"/>All subscriptions look healthy.</div>:
    <div className="bg-white border rounded-xl overflow-hidden">{items.map(n=><button key={n.id} onClick={()=>nav('/platform/subscriptions')} className="w-full text-left p-4 border-b last:border-0 hover:bg-gray-50 flex gap-3">{n.type==='info'?<Info className="text-blue-500 shrink-0"/>:<AlertTriangle className={n.type==='critical'?'text-red-500 shrink-0':'text-amber-500 shrink-0'}/>}<div><p className="font-medium">{n.title}</p><p className="text-sm text-gray-500 mt-1">{n.message}</p></div></button>)}</div>}
  </div>
}
