import React,{useMemo}from'react';
import{useNavigate}from'react-router-dom';
import{useAuth}from'../../context/AuthContext';
import{useData}from'../../context/DataContext';
import{IndianRupee,ClipboardList,Clock3,Table2,UtensilsCrossed,Plus,Receipt,RefreshCw}from'lucide-react';

export function OwnerDashboard(){
  const{user}=useAuth();
  const{getHotelOrders,getHotelTables,getHotelMenu,refresh}=useData();
  const nav=useNavigate();
  const hotelId=user?.hotelId||'';
  const orders=getHotelOrders(hotelId);
  const tables=getHotelTables(hotelId);
  const menu=getHotelMenu(hotelId);

  const stats=useMemo(()=>{
    const today=new Date().toDateString();
    const paid=orders.filter(o=>o.payment_status==='PAID');
    const revenue=paid.reduce((s,o)=>s+o.total_amount,0);
    const todays=orders.filter(o=>new Date(o.created_at).toDateString()===today).length;
    const pending=orders.filter(o=>['PENDING','PREPARING','READY'].includes(o.status)).length;
    const available=tables.filter(t=>t.status==='AVAILABLE').length;
    return{revenue,todays,pending,available};
  },[orders,tables]);

  const cards=[
    {label:'Total Revenue',value:'₹'+stats.revenue.toLocaleString('en-IN'),icon:IndianRupee,cls:'bg-amber-100 text-amber-700'},
    {label:"Today's Orders",value:String(stats.todays),icon:ClipboardList,cls:'bg-blue-100 text-blue-700'},
    {label:'Pending Orders',value:String(stats.pending),icon:Clock3,cls:'bg-orange-100 text-orange-700'},
    {label:'Tables Available',value:stats.available+'/'+tables.length,icon:Table2,cls:'bg-green-100 text-green-700'},
  ];

  const recent=[...orders].sort((a,b)=>new Date(b.created_at).getTime()-new Date(a.created_at).getTime()).slice(0,5);

  return <div className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h1 className="text-2xl font-bold text-gray-800">Dashboard</h1><p className="text-sm text-gray-500">Welcome back, {user?.name}</p></div>
      <button onClick={()=>refresh()} className="px-3 py-2 border bg-white rounded-lg flex items-center gap-2 text-sm"><RefreshCw size={16}/>Refresh</button>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({label,value,icon:Icon,cls})=><div key={label} className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm"><div className={"w-10 h-10 rounded-lg flex items-center justify-center "+cls}><Icon size={20}/></div><p className="text-2xl font-bold text-gray-800 mt-4">{value}</p><p className="text-xs text-gray-500 mt-1">{label}</p></div>)}
    </div>

    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-2">Quick Setup</h2>
      <p className="text-gray-600 mb-4">Set up your restaurant and manage daily operations.</p>
      <div className="flex flex-wrap gap-3">
        <button onClick={()=>nav('/owner/menu')} className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 flex items-center gap-2"><UtensilsCrossed size={17}/>{menu.length?'Manage Menu':'Setup Menu'}</button>
        <button onClick={()=>nav('/owner/tables')} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"><Plus size={17}/>Add Tables</button>
        <button onClick={()=>nav('/owner/orders')} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"><ClipboardList size={17}/>View Orders</button>
        <button onClick={()=>nav('/owner/billing')} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"><Receipt size={17}/>Billing</button>
      </div>
    </div>

    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-5 border-b flex items-center justify-between"><div><h2 className="font-semibold">Recent Orders</h2><p className="text-xs text-gray-500">Latest activity from your restaurant</p></div><button onClick={()=>nav('/owner/orders')} className="text-sm text-amber-600 font-medium">View all</button></div>
      {recent.length?<div className="divide-y">{recent.map(o=><button key={o.id} onClick={()=>nav('/owner/orders')} className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50"><div><p className="font-medium">Order #{o.id.slice(-6).toUpperCase()} • Table {o.table_number}</p><p className="text-xs text-gray-500">{new Date(o.created_at).toLocaleString()} • {o.items.length} item(s)</p></div><div className="text-right"><p className="font-semibold">₹{o.total_amount.toLocaleString()}</p><p className="text-xs text-gray-500">{o.status} • {o.payment_status}</p></div></button>)}</div>:<div className="p-8 text-center text-gray-500">No orders yet. Customer QR orders will appear here.</div>}
    </div>
  </div>
}
