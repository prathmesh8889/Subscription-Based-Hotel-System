import React,{useEffect,useState}from'react';
import{api}from'../../services/api';
import{Building2,User,KeyRound,Save,CheckCircle2,ShieldCheck}from'lucide-react';

export function OwnerSettingsPage(){
  const[data,setData]=useState<any>(null);
  const[form,setForm]=useState({name:'',email:'',hotelName:'',address:'',phone:'',businessEmail:''});
  const[pwd,setPwd]=useState({currentPassword:'',newPassword:'',confirmPassword:''});
  const[loading,setLoading]=useState(true);
  const[saving,setSaving]=useState(false);
  const[error,setError]=useState('');
  const[message,setMessage]=useState('');

  const load=async()=>{
    setLoading(true);
    try{
      const r=await api<any>('/owner/settings');
      setData(r.data);
      setForm({
        name:r.data.name||'',
        email:r.data.email||'',
        hotelName:r.data.hotel?.name||'',
        address:r.data.hotel?.address||'',
        phone:r.data.hotel?.phone||'',
        businessEmail:r.data.hotel?.email||'',
      });
      setError('');
    }catch(e:any){setError(e.message)}
    finally{setLoading(false)}
  };

  useEffect(()=>{load()},[]);

  const saveProfile=async(e:React.FormEvent)=>{
    e.preventDefault();setSaving(true);setError('');setMessage('');
    try{
      await api('/owner/settings',{method:'PATCH',body:JSON.stringify(form)});
      setMessage('Profile and restaurant settings updated.');
      setTimeout(()=>window.location.reload(),700);
    }catch(e:any){setError(e.message)}
    finally{setSaving(false)}
  };

  const changePassword=async(e:React.FormEvent)=>{
    e.preventDefault();setError('');setMessage('');
    if(pwd.newPassword!==pwd.confirmPassword){setError('New password and confirmation do not match.');return}
    setSaving(true);
    try{
      await api('/owner/change-password',{method:'POST',body:JSON.stringify({currentPassword:pwd.currentPassword,newPassword:pwd.newPassword})});
      setPwd({currentPassword:'',newPassword:'',confirmPassword:''});
      setMessage('Password changed successfully.');
    }catch(e:any){setError(e.message)}
    finally{setSaving(false)}
  };

  if(loading)return <div className="p-10 text-center text-gray-500">Loading settings...</div>;

  return <div className="space-y-6 max-w-5xl">
    <div><h1 className="text-2xl font-bold">Settings</h1><p className="text-sm text-gray-500">Manage restaurant profile, owner account and security.</p></div>
    {error&&<div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">{error}</div>}
    {message&&<div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-2"><CheckCircle2 size={18}/>{message}</div>}

    <form onSubmit={saveProfile} className="bg-white border rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2"><Building2 className="text-amber-600"/><h2 className="font-semibold text-lg">Restaurant & Owner Profile</h2></div>
      <div className="grid md:grid-cols-2 gap-4">
        <label className="text-sm">Owner name<input required className="mt-1 w-full border rounded-lg p-2.5" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>
        <label className="text-sm">Owner login email<input required type="email" className="mt-1 w-full border rounded-lg p-2.5" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></label>
        <label className="text-sm">Restaurant name<input required className="mt-1 w-full border rounded-lg p-2.5" value={form.hotelName} onChange={e=>setForm({...form,hotelName:e.target.value})}/></label>
        <label className="text-sm">Business email<input type="email" className="mt-1 w-full border rounded-lg p-2.5" value={form.businessEmail} onChange={e=>setForm({...form,businessEmail:e.target.value})}/></label>
        <label className="text-sm">Phone<input className="mt-1 w-full border rounded-lg p-2.5" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label>
        <label className="text-sm">Address<input className="mt-1 w-full border rounded-lg p-2.5" value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/></label>
      </div>
      <button disabled={saving} className="px-5 py-2.5 bg-amber-500 text-white rounded-lg flex items-center gap-2"><Save size={17}/>{saving?'Saving...':'Save Profile'}</button>
    </form>

    <div className="grid lg:grid-cols-2 gap-5">
      <form onSubmit={changePassword} className="bg-white border rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2"><KeyRound className="text-amber-600"/><h2 className="font-semibold text-lg">Change Password</h2></div>
        <input required type="password" className="w-full border rounded-lg p-2.5" placeholder="Current password" value={pwd.currentPassword} onChange={e=>setPwd({...pwd,currentPassword:e.target.value})}/>
        <input required minLength={10} type="password" className="w-full border rounded-lg p-2.5" placeholder="New password (10+ characters)" value={pwd.newPassword} onChange={e=>setPwd({...pwd,newPassword:e.target.value})}/>
        <input required minLength={10} type="password" className="w-full border rounded-lg p-2.5" placeholder="Confirm new password" value={pwd.confirmPassword} onChange={e=>setPwd({...pwd,confirmPassword:e.target.value})}/>
        <button disabled={saving} className="w-full py-2.5 bg-slate-900 text-white rounded-lg">Update Password</button>
      </form>

      <div className="bg-white border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4"><ShieldCheck className="text-green-600"/><h2 className="font-semibold text-lg">Subscription</h2></div>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">Plan</span><b>{data?.hotel?.subscriptionPlan}</b></div>
          <div className="flex justify-between"><span className="text-gray-500">Status</span><b>{data?.hotel?.isActive?'Active':'Inactive'}</b></div>
          <div className="flex justify-between"><span className="text-gray-500">Valid until</span><b>{data?.hotel?.subscriptionEnd?new Date(data.hotel.subscriptionEnd).toLocaleDateString():'-'}</b></div>
          <div className="flex justify-between"><span className="text-gray-500">Table limit</span><b>{data?.hotel?.maxTables}</b></div>
          <div className="flex justify-between"><span className="text-gray-500">Menu limit</span><b>{data?.hotel?.maxMenuItems}</b></div>
          <div className="flex justify-between"><span className="text-gray-500">Staff limit</span><b>{data?.hotel?.maxStaff}</b></div>
        </div>
      </div>
    </div>
  </div>
}
