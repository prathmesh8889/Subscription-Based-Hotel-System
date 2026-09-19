import React,{useEffect,useState}from'react';
import{api}from'../../services/api';
import{RefreshCw,Power,CalendarDays}from'lucide-react';

const PLANS=['TRIAL','STARTER','PRO','BUSINESS'];

export function AdminSubscriptionsPage(){
  const[rows,setRows]=useState<any[]>([]);
  const[loading,setLoading]=useState(true);
  const[error,setError]=useState('');
  const[saving,setSaving]=useState('');

  const load=async()=>{setLoading(true);try{const r=await api<any>('/platform/subscriptions');setRows(r.data);setError('')}catch(e:any){setError(e.message)}finally{setLoading(false)}};
  useEffect(()=>{load()},[]);

  const update=async(id:string,body:any)=>{
    setSaving(id);
    try{await api('/platform/hotels/'+id+'/subscription',{method:'PATCH',body:JSON.stringify(body)});await load()}
    catch(e:any){setError(e.message)}
    finally{setSaving('')}
  };

  return <div className="space-y-5">
    <div className="flex items-center justify-between gap-3">
      <div><h1 className="text-2xl font-bold">Subscriptions</h1><p className="text-sm text-gray-500">Change plans, renew access, and activate or deactivate hotels.</p></div>
      <button onClick={load} className="px-4 py-2 border rounded-lg bg-white flex items-center gap-2"><RefreshCw size={16}/>Refresh</button>
    </div>

    <div className="grid sm:grid-cols-4 gap-3">
      {PLANS.map((p,i)=><div key={p} className="bg-white border rounded-xl p-4"><b>{p}</b><p className="text-sm text-gray-500 mt-1">{['Free trial','₹499/month','₹999/month','₹1999/month'][i]}</p></div>)}
    </div>

    {error&&<div className="p-3 rounded-lg bg-red-50 text-red-700">{error}</div>}
    {loading?<div className="p-10 text-center text-gray-500">Loading...</div>:
    <div className="bg-white border rounded-xl overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50"><tr><th className="text-left p-3">Hotel</th><th className="text-left p-3">Plan</th><th className="text-left p-3">Expiry</th><th className="text-left p-3">Usage</th><th className="text-left p-3">Renew</th><th className="text-left p-3">Status</th></tr></thead>
        <tbody>{rows.map(h=><tr key={h.id} className="border-t">
          <td className="p-3"><b>{h.name}</b><div className="text-xs text-gray-500">{h.owner?.email||'No owner'}</div></td>
          <td className="p-3"><select disabled={saving===h.id} value={h.subscriptionPlan} onChange={e=>update(h.id,{plan:e.target.value})} className="border rounded p-2">{PLANS.map(p=><option key={p}>{p}</option>)}</select></td>
          <td className="p-3"><div className="flex items-center gap-1"><CalendarDays size={14}/>{new Date(h.subscriptionEnd).toLocaleDateString()}</div><div className="text-xs text-gray-500">{h.daysRemaining} day(s)</div></td>
          <td className="p-3 text-xs">{h._count.tables}/{h.maxTables} tables<br/>{h._count.users}/{h.maxStaff} staff<br/>{h._count.menuItems}/{h.maxMenuItems} menu</td>
          <td className="p-3"><div className="flex gap-1">{[30,90,365].map(d=><button key={d} disabled={saving===h.id} onClick={()=>update(h.id,{extendDays:d})} className="border rounded px-2 py-1 hover:bg-purple-50">+{d}d</button>)}</div></td>
          <td className="p-3"><button disabled={saving===h.id} onClick={()=>update(h.id,{isActive:!h.isActive})} className={"px-3 py-2 rounded-lg flex items-center gap-1 "+(h.isActive?'bg-green-50 text-green-700':'bg-red-50 text-red-700')}><Power size={14}/>{h.isActive?'Active':'Inactive'}</button></td>
        </tr>)}</tbody>
      </table>
      {rows.length===0&&<div className="p-10 text-center text-gray-500">No subscriptions found.</div>}
    </div>}
  </div>
}
