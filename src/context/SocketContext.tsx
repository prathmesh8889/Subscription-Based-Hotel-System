import React,{createContext,useContext,useEffect,useState,useCallback,ReactNode}from'react';
import{io,Socket}from'socket.io-client';
import{useAuth}from'./AuthContext';
import{api}from'../services/api';

interface O{
  orderId:string;hotelId:string;tableId?:string;tableNumber:number;items:any[];
  totalAmount:number;status:'PENDING'|'PREPARING'|'READY'|'SERVED';
  paymentStatus?:'UNPAID'|'PAID';paymentMethod?:'CASH'|'UPI'|'CARD';
  createdAt:string;updatedAt?:string;handledBy?:string;notes?:string
}
interface C{
  socket:Socket|null;isConnected:boolean;orders:O[];
  placeOrder:(d:any)=>Promise<any>;
  updateOrderStatus:(id:string,s:O['status'])=>Promise<any>;
  updatePaymentStatus:(id:string,m:'CASH'|'UPI'|'CARD')=>Promise<any>
}
const X=createContext<C|undefined>(undefined);
const SOCKET_URL=(import.meta as any).env?.VITE_SOCKET_URL||window.location.origin;
const N=(o:any):O=>({
  orderId:o.id||o.orderId,hotelId:o.hotelId,tableId:o.tableId,
  tableNumber:o.tableNumber??o.table?.tableNumber??0,items:o.items||[],
  totalAmount:Number(o.totalAmount),status:o.status,paymentStatus:o.paymentStatus,
  paymentMethod:o.paymentMethod,createdAt:o.createdAt,updatedAt:o.updatedAt,
  handledBy:o.handledBy,notes:o.notes
});

export function SocketProvider({children}:{children:ReactNode}){
  const{user}=useAuth();
  const[socket,setSocket]=useState<Socket|null>(null);
  const[isConnected,setConnected]=useState(false);
  const[orders,setOrders]=useState<O[]>([]);

  const load=useCallback(async()=>{
    if(!user?.hotelId)return;
    const r=await api<any>('/orders');
    setOrders(r.data.map(N));
  },[user?.hotelId]);

  useEffect(()=>{
    if(!user?.hotelId){setOrders([]);return}
    load().catch(console.error);
    const s=io(SOCKET_URL,{withCredentials:true,transports:['websocket','polling']});
    setSocket(s);
    s.on('connect',()=>setConnected(true));
    s.on('disconnect',()=>setConnected(false));
    s.on('new_order',(o:any)=>setOrders(p=>[N(o),...p.filter(x=>x.orderId!==(o.id||o.orderId))]));
    s.on('order_status_updated',(u:any)=>setOrders(p=>p.map(o=>o.orderId===u.orderId?{...o,status:u.status,updatedAt:u.updatedAt}:o)));
    return()=>{s.disconnect();setSocket(null);setConnected(false)}
  },[user?.hotelId,load]);

  const placeOrder=async()=>({success:false,error:'Use customer QR page'});
  const updateOrderStatus=async(id:string,status:O['status'])=>{
    try{
      const r=await api<any>('/orders/'+id+'/status',{method:'PATCH',body:JSON.stringify({status})});
      setOrders(p=>p.map(o=>o.orderId===id?N(r.data):o));
      return{success:true}
    }catch(e:any){return{success:false,error:e.message}}
  };
  const updatePaymentStatus=async(id:string,m:'CASH'|'UPI'|'CARD')=>{
    try{
      await api('/billing/pay/'+id,{method:'POST',body:JSON.stringify({paymentMethod:m})});
      await load();
      return{success:true}
    }catch(e:any){return{success:false,error:e.message}}
  };

  return <X.Provider value={{socket,isConnected,orders,placeOrder,updateOrderStatus,updatePaymentStatus}}>{children}</X.Provider>
}
export function useSocket(){
  const c=useContext(X);
  if(!c)throw new Error('useSocket must be used within SocketProvider');
  return c
}
