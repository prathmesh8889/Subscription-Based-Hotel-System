import React,{useCallback,useEffect,useMemo,useState}from'react';
import{io}from'socket.io-client';
import{ArrowLeft,CheckCircle2,Clock3,ChefHat,BellRing,Utensils,Receipt,Wifi,WifiOff,RefreshCw,XCircle}from'lucide-react';
import{api}from'../../services/api';

const SOCKET_URL=(import.meta as any).env?.VITE_SOCKET_URL||window.location.origin;
const STEPS=['PENDING','PREPARING','READY','SERVED'];

export function CustomerOrderTracker({hotelId,tableId,token,hotelName,tableNumber,orderIds,onBack}:any){
  const[orders,setOrders]=useState<any[]>([]);
  const[connected,setConnected]=useState(false);
  const[error,setError]=useState('');

  const mergeOrder=useCallback((incoming:any)=>{
    const id=incoming.orderId||incoming.id;
    if(!id)return;
    setOrders(prev=>{
      const found=prev.find(o=>(o.orderId||o.id)===id);
      if(found)return prev.map(o=>(o.orderId||o.id)===id?{...o,...incoming,id,orderId:id}:o);
      return [{...incoming,id,orderId:id},...prev];
    });
  },[]);

  const loadOrders=useCallback(async()=>{
    if(!orderIds.length){setOrders([]);return}
    try{
      const results=await Promise.all(orderIds.map(async(id)=>{
        try{
          const r=await api<any>('/public/orders/'+encodeURIComponent(id)+'?hotelId='+encodeURIComponent(hotelId)+'&tableId='+encodeURIComponent(tableId)+'&token='+encodeURIComponent(token));
          return r.data;
        }catch{return null}
      }));
      setOrders(results.filter(Boolean));
      setError('');
    }catch(e:any){setError(e.message)}
  },[hotelId,tableId,token,orderIds.join('|')]);

  useEffect(()=>{
    loadOrders();
    const timer=setInterval(loadOrders,10000);
    return()=>clearInterval(timer);
  },[loadOrders]);

  useEffect(()=>{
    const socket=io(SOCKET_URL+'/customer',{
      transports:['websocket','polling'],
      auth:{hotelId,tableId,token},
    });

    socket.on('connect',()=>{
      setConnected(true);
      orderIds.forEach(id=>socket.emit('watch_order',{orderId:id}));
    });
    socket.on('disconnect',()=>setConnected(false));
    socket.on('connect_error',()=>setConnected(false));
    socket.on('order_snapshot',mergeOrder);
    socket.on('order_updated',mergeOrder);

    return()=>socket.disconnect();
  },[hotelId,tableId,token,orderIds.join('|'),mergeOrder]);

  const sorted=useMemo(()=>[...orders].sort((a,b)=>new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime()),[orders]);

  const iconFor=(status:string)=>{
    if(status==='PENDING')return Clock3;
    if(status==='PREPARING')return ChefHat;
    if(status==='READY')return BellRing;
    return Utensils;
  };

  return <div className="min-h-screen bg-gray-50">
    <header className="bg-white border-b sticky top-0 z-20">
      <div className="max-w-3xl mx-auto p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-lg hover:bg-gray-100"><ArrowLeft size={20}/></button>
          <div><h1 className="font-bold text-lg">{hotelName||'My Orders'}</h1><p className="text-xs text-gray-500">Table {tableNumber} • Live order tracking</p></div>
        </div>
        <div className={"text-xs px-2.5 py-1.5 rounded-full flex items-center gap-1.5 "+(connected?'bg-green-50 text-green-700':'bg-amber-50 text-amber-700')}>
          {connected?<Wifi size={14}/>:<WifiOff size={14}/>}
          {connected?'Live':'Syncing'}
        </div>
      </div>
    </header>

    <main className="max-w-3xl mx-auto p-4 space-y-4">
      {error&&<div className="p-3 bg-red-50 text-red-700 rounded-lg">{error}</div>}
      {!sorted.length&&<div className="bg-white border rounded-xl p-10 text-center"><Receipt className="mx-auto text-gray-400 mb-3"/><h2 className="font-semibold">No orders yet</h2><p className="text-sm text-gray-500 mt-1">Place an order from the menu and it will appear here.</p><button onClick={onBack} className="mt-4 px-4 py-2 bg-amber-500 text-white rounded-lg">Open Menu</button></div>}

      {sorted.map(order=>{
        const status=order.status||'PENDING';
        const activeIndex=STEPS.indexOf(status);
        const cancelled=status==='CANCELLED';
        const StatusIcon=cancelled?XCircle:iconFor(status);

        return <section key={order.orderId||order.id} className="bg-white border rounded-2xl overflow-hidden shadow-sm">
          <div className="p-5 border-b">
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <p className="text-xs text-gray-500">Order</p>
                <h2 className="font-bold text-lg">#{String(order.orderId||order.id).slice(-8).toUpperCase()}</h2>
                <p className="text-xs text-gray-500 mt-1">{order.createdAt?new Date(order.createdAt).toLocaleString():''}</p>
              </div>
              <div className={"px-3 py-2 rounded-lg flex items-center gap-2 font-medium "+(cancelled?'bg-red-50 text-red-700':status==='SERVED'?'bg-green-50 text-green-700':'bg-amber-50 text-amber-700')}>
                <StatusIcon size={18}/>{status.replace('_',' ')}
              </div>
            </div>

            {!cancelled&&<div className="mt-5 grid grid-cols-4 gap-1">
              {STEPS.map((step,index)=>{
                const done=index<=activeIndex;
                return <div key={step} className="text-center">
                  <div className={"h-1.5 rounded-full mb-2 "+(done?'bg-amber-500':'bg-gray-200')}/>
                  <p className={"text-[10px] sm:text-xs "+(done?'font-semibold text-amber-700':'text-gray-400')}>{step==='PENDING'?'Placed':step==='PREPARING'?'Preparing':step==='READY'?'Ready':'Served'}</p>
                </div>
              })}
            </div>}
          </div>

          <div className="p-5">
            <h3 className="font-semibold mb-3">Order Details</h3>
            <div className="space-y-3">
              {(order.items||[]).map((item:any,index:number)=><div key={item.menuItemId||index} className="flex justify-between gap-3">
                <div><p className="font-medium">{item.name}</p><p className="text-xs text-gray-500">{item.quantity} × ₹{Number(item.price).toFixed(2)}</p></div>
                <b>₹{(Number(item.price)*Number(item.quantity)).toFixed(2)}</b>
              </div>)}
            </div>

            <div className="border-t mt-4 pt-4 flex justify-between text-lg"><b>Total</b><b>₹{Number(order.totalAmount||0).toFixed(2)}</b></div>

            <div className="grid sm:grid-cols-2 gap-3 mt-4 text-sm">
              <div className="bg-gray-50 rounded-lg p-3"><p className="text-gray-500">Payment</p><p className="font-semibold mt-1">{order.paymentStatus||'UNPAID'}{order.paymentMethod?' • '+order.paymentMethod:''}</p></div>
              <div className="bg-gray-50 rounded-lg p-3"><p className="text-gray-500">Last updated</p><p className="font-semibold mt-1">{order.updatedAt?new Date(order.updatedAt).toLocaleTimeString():'Just now'}</p></div>
            </div>

            {order.notes&&<div className="mt-3 bg-blue-50 text-blue-800 rounded-lg p-3 text-sm"><b>Note:</b> {order.notes}</div>}
          </div>
        </section>
      })}

      {!!sorted.length&&<div className="flex justify-center"><button onClick={loadOrders} className="px-4 py-2 border bg-white rounded-lg flex items-center gap-2 text-sm"><RefreshCw size={15}/>Refresh now</button></div>}
    </main>
  </div>
}
