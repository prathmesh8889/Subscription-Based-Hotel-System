import React,{useEffect,useState}from'react';
import{api}from'../../services/api';
import{Building2,Users,ClipboardList,IndianRupee,AlertTriangle,CheckCircle2}from'lucide-react';

export function AdminAnalyticsPage(){
  const[data,setData]=useState<any>(null);
  const[error,setError]=useState('');
  useEffect(()=>{api<any>('/platform/analytics').then(r=>setData(r.data)).catch(e=>setError(e.message))},[]);
  if(error)return <div className="p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>;
  if(!data)return <div className="p-10 text-center text-gray-500">Loading analytics...</div>;

  const cards=[
    ['Hotels',data.summary.totalHotels,Building2],
    ['Active',data.summary.activeHotels,CheckCircle2],
    ['Expired',data.summary.expiredHotels,AlertTriangle],
    ['Users',data.summary.totalUsers,Users],
    ['Orders',data.summary.totalOrders,ClipboardList],
    ['Revenue','₹'+Number(data.summary.paidRevenue).toLocaleString('en-IN'),IndianRupee],
  ];

  return <div className="space-y-6">
    <div><h1 className="text-2xl font-bold">Platform Analytics</h1><p className="text-sm text-gray-500">Live metrics across all hotels.</p></div>
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">{cards.map(([label,value,Icon]:any)=><div key={label} className="bg-white border rounded-xl p-4"><Icon size={19} className="text-purple-600"/><p className="text-xs text-gray-500 mt-3">{label}</p><p className="text-xl font-bold">{value}</p></div>)}</div>
    <div className="grid lg:grid-cols-2 gap-5">
      <div className="bg-white border rounded-xl p-5"><h3 className="font-semibold mb-4">Plan Distribution</h3>{data.planDistribution.map((p:any)=><div key={p.plan} className="flex justify-between py-3 border-b last:border-0"><span>{p.plan}</span><b>{p.count}</b></div>)}</div>
      <div className="bg-white border rounded-xl p-5"><h3 className="font-semibold mb-4">Top Hotels — 30 Days</h3>{data.topHotels.map((h:any,i:number)=><div key={h.hotelId} className="flex justify-between py-3 border-b last:border-0"><span>{i+1}. {h.name} <small className="text-gray-500">({h.orders} orders)</small></span><b>₹{Number(h.revenue).toLocaleString('en-IN')}</b></div>)}{data.topHotels.length===0&&<p className="text-sm text-gray-500">No order data yet.</p>}</div>
    </div>
  </div>
}
