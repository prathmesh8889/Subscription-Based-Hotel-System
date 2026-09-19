import React,{useEffect,useMemo,useState}from'react';
import{useParams,useSearchParams}from'react-router-dom';
import{Plus,Minus,Loader,AlertCircle,ShoppingCart,Receipt}from'lucide-react';
import{api}from'../../services/api';
import{CustomerOrderTracker}from'./CustomerOrderTracker';

export function CustomerQRMenu(){
  const{hotelId}=useParams();
  const[q]=useSearchParams();
  const tableId=q.get('table')||'';
  const token=q.get('token')||'';
  const storageKey='restroflow_customer_orders_'+hotelId+'_'+tableId;

  const[data,setData]=useState<any>(null);
  const[cart,setCart]=useState<Record<string,number>>({});
  const[loading,setLoading]=useState(true);
  const[error,setError]=useState('');
  const[placing,setPlacing]=useState(false);
  const[view,setView]=useState<'menu'|'orders'>('menu');
  const[orderIds,setOrderIds]=useState<string[]>([]);

  useEffect(()=>{
    try{
      const raw=JSON.parse(localStorage.getItem(storageKey)||'[]');
      const valid=(Array.isArray(raw)?raw:[]).filter((x:any)=>x?.id&&Date.now()-Number(x.createdAt||0)<24*60*60*1000);
      setOrderIds(valid.map((x:any)=>x.id));
      localStorage.setItem(storageKey,JSON.stringify(valid));
    }catch{setOrderIds([])}
  },[storageKey]);

  useEffect(()=>{
    if(!hotelId||!tableId||!token){setError('Invalid QR code.');setLoading(false);return}
    api<any>('/public/menu/'+hotelId+'?tableId='+encodeURIComponent(tableId)+'&token='+encodeURIComponent(token))
      .then(r=>setData(r.data))
      .catch(e=>setError(e.message))
      .finally(()=>setLoading(false));
  },[hotelId,tableId,token]);

  const menu=data?.menuItems||[];
  const total=useMemo(()=>menu.reduce((sum:number,item:any)=>sum+(cart[item.id]||0)*Number(item.price),0),[menu,cart]);
  const qty=Object.values(cart).reduce((a,b)=>a+b,0);

  const changeQty=(id:string,delta:number)=>setCart(current=>({...current,[id]:Math.max(0,(current[id]||0)+delta)}));

  const rememberOrder=(id:string)=>{
    const next=[id,...orderIds.filter(x=>x!==id)].slice(0,20);
    setOrderIds(next);
    localStorage.setItem(storageKey,JSON.stringify(next.map(orderId=>({id:orderId,createdAt:Date.now()}))));
  };

  const placeOrder=async()=>{
    if(!qty||!hotelId)return;
    setPlacing(true);setError('');
    try{
      const items=Object.entries(cart).filter(([,n])=>n>0).map(([menuItemId,quantity])=>({menuItemId,quantity}));
      const result=await api<any>('/public/orders',{
        method:'POST',
        body:JSON.stringify({hotelId,tableId,token,items}),
      });
      rememberOrder(result.data.orderId||result.data.id);
      setCart({});
      setView('orders');
    }catch(e:any){setError(e.message)}
    finally{setPlacing(false)}
  };

  if(loading)return <div className="min-h-screen grid place-items-center"><Loader className="animate-spin"/></div>;
  if(error&&!data)return <div className="min-h-screen grid place-items-center p-4"><div className="text-center"><AlertCircle className="mx-auto text-red-500 mb-2"/><p>{error}</p></div></div>;

  if(view==='orders'){
    return <CustomerOrderTracker
      hotelId={hotelId}
      tableId={tableId}
      token={token}
      hotelName={data?.hotel?.name}
      tableNumber={data?.table?.tableNumber}
      orderIds={orderIds}
      onBack={()=>setView('menu')}
    />
  }

  return <div className="min-h-screen bg-gray-50 pb-24">
    <header className="bg-white border-b sticky top-0 z-20">
      <div className="max-w-3xl mx-auto p-4 flex justify-between items-center gap-3">
        <div><h1 className="font-bold text-xl">{data?.hotel?.name}</h1><p className="text-sm text-gray-500">Table {data?.table?.tableNumber}</p></div>
        <button onClick={()=>setView('orders')} className="relative px-3 py-2 border rounded-lg flex items-center gap-2 text-sm font-medium"><Receipt size={17}/>My Orders{orderIds.length>0&&<span className="bg-amber-500 text-white min-w-5 h-5 px-1 rounded-full text-xs grid place-items-center">{orderIds.length}</span>}</button>
      </div>
    </header>

    <main className="max-w-3xl mx-auto p-4 space-y-3">
      {error&&<p className="p-3 bg-red-50 text-red-700 rounded">{error}</p>}
      {menu.map((item:any)=><div key={item.id} className="bg-white border rounded-xl p-4 flex justify-between gap-4">
        <div><h3 className="font-semibold">{item.name}</h3><p className="text-sm text-gray-500">{item.description}</p><p className="font-bold mt-2">₹{Number(item.price).toFixed(0)}</p></div>
        <div className="flex items-center gap-2 self-center">
          {(cart[item.id]||0)>0&&<><button onClick={()=>changeQty(item.id,-1)} className="p-2 bg-gray-100 rounded-full"><Minus size={16}/></button><span>{cart[item.id]}</span></>}
          <button onClick={()=>changeQty(item.id,1)} className="p-2 bg-amber-500 text-white rounded-full"><Plus size={16}/></button>
        </div>
      </div>)}
    </main>

    {qty>0&&<div className="fixed bottom-0 inset-x-0 bg-white border-t p-4"><button onClick={placeOrder} disabled={placing} className="max-w-3xl mx-auto w-full p-3 rounded-xl bg-amber-500 text-white font-semibold flex justify-between"><span className="flex gap-2"><ShoppingCart size={18}/>{qty} items</span><span>{placing?'Placing...':'₹'+total.toFixed(0)+' • Place Order'}</span></button></div>}
  </div>
}
