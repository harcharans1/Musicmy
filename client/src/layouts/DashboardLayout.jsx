import {Link,Outlet,useLocation,useNavigate} from 'react-router-dom';
import {BarChart3,Bot,Clock3,CreditCard,Heart,LayoutDashboard,LogOut,Menu,Settings,X} from 'lucide-react';
import {useEffect,useState} from 'react';
import Logo from '../components/Logo';
import {useAuth} from '../context/AuthContext';

const items=[['Dashboard','/dashboard',LayoutDashboard],['AI Tools','/dashboard/tools',Bot],['History','/dashboard/history',Clock3],['Favorites','/dashboard/favorites',Heart],['Usage','/dashboard/usage',BarChart3],['Subscription','/dashboard/subscription',CreditCard],['Settings','/dashboard/settings',Settings]];

function NavItems({loc,onNavigate}){return <nav className="space-y-1">{items.map(([n,p,I])=><Link onClick={onNavigate} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${loc.pathname===p?'bg-violet-500/10 text-violet-300':'text-slate-500 hover:bg-white/[.04] hover:text-slate-200'}`} to={p} key={p}><I size={17} className="shrink-0"/>{n}</Link>)}</nav>}

export default function DashboardLayout(){
  const loc=useLocation(),nav=useNavigate(),{logout}=useAuth();
  const [open,setOpen]=useState(false);
  useEffect(()=>setOpen(false),[loc.pathname]);
  const signOut=async()=>{await logout();nav('/')};
  return <div className="min-h-screen overflow-x-hidden bg-ink md:pl-64">
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-white/5 bg-[#0b0c11] p-5 md:block">
      <Link to="/" className="block"><Logo/></Link>
      <div className="mt-8"><NavItems loc={loc}/></div>
      <button onClick={signOut} className="mt-8 flex items-center gap-3 px-3 text-sm text-slate-500 hover:text-white"><LogOut size={17}/>Logout</button>
    </aside>

    <div className="sticky top-0 z-30 border-b border-white/5 bg-[#08090d]/90 px-4 py-3 backdrop-blur-xl md:px-5 md:py-5">
      <div className="flex items-center justify-between gap-3">
        <Link to="/" className="md:hidden"><Logo/></Link>
        <span className="hidden text-xs text-slate-600 sm:block md:ml-auto">AIForge Workspace</span>
        <button type="button" aria-label="Open workspace menu" aria-expanded={open} onClick={()=>setOpen(!open)} className="ml-auto grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[.03] text-slate-200 md:hidden">
          {open?<X size={19}/>:<Menu size={19}/>} 
        </button>
      </div>
      {open&&<div className="mt-3 rounded-2xl border border-white/10 bg-[#0b0c11] p-2 md:hidden"><NavItems loc={loc} onNavigate={()=>setOpen(false)}/><button onClick={signOut} className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-500 hover:bg-white/[.04] hover:text-white"><LogOut size={17}/>Logout</button></div>}
    </div>

    <main className="min-w-0"><div className="mx-auto w-full max-w-7xl min-w-0 p-4 sm:p-5 md:p-8"><Outlet/></div></main>
  </div>
}
