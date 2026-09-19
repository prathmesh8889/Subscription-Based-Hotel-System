import React,{useEffect,useState}from'react';
import{api}from'../../services/api';
import{Plus,RefreshCw,Users}from'lucide-react';

const blank={name:'',address:'',phone:'',email:'',subscriptionPlan:'TRIAL',subscriptionDays:14,ownerName:'',ownerEmail:'',ownerPassword:''};

export function AdminClientsPage(){
  const[clients,setClients]=useState<any[]>([]);
  const[form,setForm]=useState<any>(blank);
  const[show,setShow]=useState(false);
  const[loading,setLoading]=useState(true);
  const[saving,setSaving]=useState(false);
  const[error,setError]=useState('');
  const[message,setMessage]=useState('');

  const load=async()=>{setLoading(true);try{const r=await api<any>('/platform/clients');setClients(r.data);setError('')}catch(e:any){setError(e.message)}finally{setLoading(false)}};
  useEffect(()=>{load()},[]);

  const create=async()=>{
    setSaving(true);setError('');setMessage('');
    try{
      await api('/platform/clients',{method:'POST',body:JSON.stringify({...form,subscriptionDays:Number(form.subscriptionDays)})});
      setMessage('Client and owner login created successfully.');
      setForm(blank);setShow(false);await load();
    }catch(e:any){setError(e.message)}
    finally{setSaving(false)}
  };

  return <div className="space-y-5">
    <div className="flex justify-between gap-3">
      <div><h1 className="text-2xl font-bold">Clients</h1><p className="text-sm text-gray-500">Create multiple subscription clients with independent owner logins.</p></div>
      <div className="flex gap-2"><button onClick={load} className="border rounded-lg px-3 py-2 flex gap-2 items-center"><RefreshCw size={16}/>Refresh</button><button onClick={()=>setShow(v=>!v)} className="bg-purple-600 text-white rounded-lg px-4 py-2 flex gap-2 items-center"><Plus size={16}/>Add Client</button></div>
    </div>

    {error&&<div className="p-3 bg-red-50 text-red-700 rounded-lg">{error}</div>}
    {message&&<div className="p-3 bg-green-50 text-green-700 rounded-lg">{message}</div>}

    {show&&<div className="bg-white border rounded-xl p-5 grid md:grid-cols-3 gap-3">
      <input className="border rounded-lg p-2.5" placeholder="Business / Hotel name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/>
      <input className="border rounded-lg p-2.5" placeholder="Address" value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/>
      <input className="border rounded-lg p-2.5" placeholder="Business phone" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/>
      <input className="border rounded-lg p-2.5" placeholder="Business email (optional)" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/>
      <input className="border rounded-lg p-2.5" placeholder="Owner name" value={form.ownerName} onChange={e=>setForm({...form,ownerName:e.target.value})}/>
      <input className="border rounded-lg p-2.5" placeholder="Owner login email" value={form.ownerEmail} onChange={e=>setForm({...form,ownerEmail:e.target.value})}/>
      <input className="border rounded-lg p-2.5" type="password" placeholder="Temporary password (8+ chars)" value={form.ownerPassword} onChange={e=>setForm({...form,ownerPassword:e.target.value})}/>
      <select className="border rounded-lg p-2.5" value={form.subscriptionPlan} onChange={e=>setForm({...form,subscriptionPlan:e.target.value})}><option>TRIAL</option><option>STARTER</option><option>PRO</option><option>BUSINESS</option></select>
      <input className="border rounded-lg p-2.5" type="number" min="1" max="365" value={form.subscriptionDays} onChange={e=>setForm({...form,subscriptionDays:Number(e.target.value)})}/>
      <button disabled={saving} onClick={create} className="md:col-span-3 bg-purple-600 text-white rounded-lg py-3 font-medium">{saving?'Creating...':'Create Client + Owner Login'}</button>
    </div>}

    <div className="bg-white border rounded-xl overflow-x-auto">
      <table className="w-full text-sm"><thead className="bg-gray-50"><tr><th className="text-left p-3">Client</th><th className="text-left p-3">Login</th><th className="text-left p-3">Subscription</th><th className="text-left p-3">Usage</th><th className="text-left p-3">Status</th></tr></thead><tbody>
      {clients.map(c=><tr key={c.id} className="border-t"><td className="p-3"><b>{c.name}</b><div className="text-xs text-gray-500">{c.hotel?.name}</div></td><td className="p-3">{c.email}<div className="text-xs text-gray-500">Owner account</div></td><td className="p-3">{c.hotel?.subscriptionPlan}<div className="text-xs text-gray-500">Ends {c.hotel?new Date(c.hotel.subscriptionEnd).toLocaleDateString():'-'}</div></td><td className="p-3 text-xs">{c.hotel?c.hotel._count.tables:0} tables • {c.hotel?c.hotel._count.orders:0} orders</td><td className="p-3"><span className={"px-2 py-1 rounded-full text-xs "+(c.isActive&&c.hotel?.isActive?'bg-green-100 text-green-700':'bg-red-100 text-red-700')}>{c.isActive&&c.hotel?.isActive?'Active':'Inactive'}</span></td></tr>)}
      </tbody></table>
      {!loading&&clients.length===0&&<div className="p-10 text-center text-gray-500"><Users className="mx-auto mb-2"/>No clients yet.</div>}
      {loading&&<div className="p-10 text-center text-gray-500">Loading clients...</div>}
    </div>
  </div>
}
