import {Link,useLocation,useNavigate} from 'react-router-dom';
import {Menu,X} from 'lucide-react';
import {useEffect,useState} from 'react';
import Logo from './Logo';
import Button from './Button';
import {useAuth} from '../context/AuthContext';

export default function Navbar(){
  const [open,setOpen]=useState(false);
  const {user}=useAuth();
  const nav=useNavigate();
  const location=useLocation();
  const links=[['AI Tools','/ai-tools'],['Pricing','/pricing'],['Blog','/blog'],['About','/about']];

  useEffect(()=>setOpen(false),[location.pathname]);

  return <header className="sticky top-0 z-50 border-b border-white/5 bg-ink/90 backdrop-blur-xl">
    <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-5 sm:py-4">
      <Link to="/" aria-label="AIForge home" className="shrink-0"><Logo/></Link>
      <nav className="hidden items-center gap-5 lg:flex xl:gap-7">
        {links.map(([n,p])=><Link className="text-sm text-slate-400 transition hover:text-white" to={p} key={p}>{n}</Link>)}
      </nav>
      <div className="hidden items-center gap-2 sm:flex">
        {user?<Button variant="ghost" onClick={()=>nav('/dashboard')}>Dashboard</Button>:<><Button variant="ghost" onClick={()=>nav('/login')}>Login</Button><Button variant="glow" onClick={()=>nav('/register')}>Get Started</Button></>}
      </div>
      <button type="button" aria-label={open?'Close menu':'Open menu'} aria-expanded={open} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[.03] text-slate-200 sm:hidden" onClick={()=>setOpen(!open)}>
        {open?<X size={20}/>:<Menu size={20}/>} 
      </button>
    </div>
    {open&&<div className="border-t border-white/5 bg-[#090a0f] px-4 pb-5 pt-2 sm:hidden">
      <nav className="space-y-1">
        {links.map(([n,p])=><Link className="block rounded-xl px-3 py-3 text-sm text-slate-300 hover:bg-white/[.04]" to={p} key={p}>{n}</Link>)}
      </nav>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {user?<Button className="col-span-2 w-full" onClick={()=>nav('/dashboard')}>Dashboard</Button>:<><Button variant="ghost" className="w-full" onClick={()=>nav('/login')}>Login</Button><Button variant="glow" className="w-full" onClick={()=>nav('/register')}>Get Started</Button></>}
      </div>
    </div>}
  </header>
}
