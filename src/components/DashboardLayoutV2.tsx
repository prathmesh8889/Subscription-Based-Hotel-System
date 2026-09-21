import React,{useState}from'react';
import{NavLink,useNavigate}from'react-router-dom';
import{useAuth}from'../context/AuthContext';
import{Building2,CreditCard,LayoutDashboard,Settings,Bell,LogOut,UtensilsCrossed,Users,Menu,X}from'lucide-react';
import{PlatformPanelSwitch}from'./PlatformPanelSwitch';

export function DashboardLayoutV2(){
  const{user,logout}=useAuth();
  const nav=useNavigate();
  const[sidebarOpen,setSidebarOpen]=useState(false);
  const signOut=async()=>{await logout();nav('/platform/login')};
  const links=[
    ['/platform/dashboard',Building2,'Hotels'],
    ['/platform/clients',Users,'Clients'],
    ['/platform/subscriptions',CreditCard,'Subscriptions'],
    ['/platform/analytics',LayoutDashboard,'Analytics'],
    ['/platform/settings',Settings,'Settings'],
  ];

  return <div className="min-h-screen bg-gray-50 flex w-full overflow-x-hidden">
    <aside className={"fixed inset-y-0 left-0 z-50 w-64 max-w-[86vw] bg-slate-900 text-white transform transition-transform duration-200 lg:translate-x-0 lg:static lg:max-w-none "+(sidebarOpen?'translate-x-0':'-translate-x-full')}>
      <div className="h-full min-h-screen flex flex-col">
        <div className="p-4 border-b border-slate-700 flex gap-3 items-center">
          <div className="w-10 h-10 shrink-0 bg-amber-500 rounded-lg grid place-items-center"><UtensilsCrossed size={20}/></div>
          <div className="min-w-0 flex-1"><b className="block truncate">SaaS Admin</b><p className="text-xs text-slate-400 truncate">Platform Management</p></div>
          <button onClick={()=>setSidebarOpen(false)} className="lg:hidden p-2 rounded-lg hover:bg-slate-800" aria-label="Close menu"><X size={20}/></button>
        </div>
        <nav className="p-4 space-y-1 overflow-y-auto flex-1">{links.map(([to,Icon,label]:any)=><NavLink key={to} to={to} onClick={()=>setSidebarOpen(false)} className={({isActive})=>"flex gap-3 items-center px-3 py-2.5 rounded-lg text-sm font-medium "+(isActive?'bg-amber-500/20 text-amber-400':'text-slate-300 hover:bg-slate-800')}><Icon size={18}/><span className="truncate">{label}</span></NavLink>)}</nav>
        <div className="p-4 border-t border-slate-700">
          <p className="text-sm mb-1 truncate">{user?.name}</p>
          <p className="text-xs text-slate-400 mb-3 truncate">{user?.role}</p>
          <button onClick={signOut} className="flex gap-2 items-center text-slate-300 w-full px-2 py-2 rounded-lg hover:bg-slate-800"><LogOut size={16}/>Sign Out</button>
        </div>
      </div>
    </aside>

    {sidebarOpen&&<button aria-label="Close sidebar overlay" onClick={()=>setSidebarOpen(false)} className="fixed inset-0 z-40 bg-black/50 lg:hidden"/>}

    <div className="flex-1 min-w-0 w-full">
      <header className="bg-white border-b px-3 sm:px-5 py-3 sm:py-4 flex items-center justify-between gap-3 sticky top-0 z-30">
        <div className="flex items-center gap-2 min-w-0">
          <button onClick={()=>setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg shrink-0" aria-label="Open menu"><Menu size={20}/></button>
          <b className="truncate text-sm sm:text-base">Super Admin Panel</b>
        </div>
        <div className="flex gap-1 sm:gap-2 shrink-0">
          <button onClick={()=>nav('/platform/notifications')} className="p-2 hover:bg-gray-100 rounded-lg" aria-label="Notifications"><Bell size={18}/></button>
          <button onClick={()=>nav('/platform/settings')} className="p-2 hover:bg-gray-100 rounded-lg" aria-label="Settings"><Settings size={18}/></button>
        </div>
      </header>
      <main className="p-3 sm:p-4 lg:p-6 min-w-0 overflow-x-hidden"><PlatformPanelSwitch/></main>
    </div>
  </div>
}
