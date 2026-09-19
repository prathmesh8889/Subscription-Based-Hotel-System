import React from'react';
import{NavLink,useNavigate}from'react-router-dom';
import{useAuth}from'../context/AuthContext';
import{Building2,CreditCard,LayoutDashboard,Settings,Bell,LogOut,UtensilsCrossed,Users}from'lucide-react';
import{PlatformPanelSwitch}from'./PlatformPanelSwitch';

export function DashboardLayoutV2(){
  const{user,logout}=useAuth();
  const nav=useNavigate();
  const signOut=async()=>{await logout();nav('/platform/login')};
  const links=[
    ['/platform/dashboard',Building2,'Hotels'],
    ['/platform/clients',Users,'Clients'],
    ['/platform/subscriptions',CreditCard,'Subscriptions'],
    ['/platform/analytics',LayoutDashboard,'Analytics'],
    ['/platform/settings',Settings,'Settings'],
  ];

  return <div className="min-h-screen bg-gray-50 flex">
    <aside className="w-64 bg-slate-900 text-white min-h-screen">
      <div className="p-4 border-b border-slate-700 flex gap-3 items-center"><div className="w-10 h-10 bg-amber-500 rounded-lg grid place-items-center"><UtensilsCrossed size={20}/></div><div><b>SaaS Admin</b><p className="text-xs text-slate-400">Platform Management</p></div></div>
      <nav className="p-4 space-y-1">{links.map(([to,Icon,label]:any)=><NavLink key={to} to={to} className={({isActive})=>"flex gap-3 items-center px-3 py-2.5 rounded-lg "+(isActive?'bg-amber-500/20 text-amber-400':'text-slate-300 hover:bg-slate-800')}><Icon size={18}/>{label}</NavLink>)}</nav>
      <div className="absolute bottom-0 w-64 p-4 border-t border-slate-700"><p className="text-sm mb-1">{user?.name}</p><p className="text-xs text-slate-400 mb-3">{user?.role}</p><button onClick={signOut} className="flex gap-2 items-center text-slate-300"><LogOut size={16}/>Sign Out</button></div>
    </aside>
    <div className="flex-1 min-w-0">
      <header className="bg-white border-b px-5 py-4 flex justify-between"><b>Super Admin Panel</b><div className="flex gap-2"><button onClick={()=>nav('/platform/notifications')} className="p-2 hover:bg-gray-100 rounded"><Bell size={18}/></button><button onClick={()=>nav('/platform/settings')} className="p-2 hover:bg-gray-100 rounded"><Settings size={18}/></button></div></header>
      <main className="p-6"><PlatformPanelSwitch/></main>
    </div>
  </div>
}
