import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { contentApi } from "../services/api";
import { Check, Lock, Sparkles, Zap } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const freeTools = [
  "AI Writer",
  "AI Paraphraser",
  "AI Summarizer",
  "AI Translator",
  "Email Writer",
  "Caption Generator",
];

const proTools = [
  "AI Image Generator",
  "Code Generator",
  "Code Explainer",
  "AI Resume Builder",
  "1,000 credits/month",
  "Priority premium access",
];

export function Pricing() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const isPro =
    user?.role === "admin" ||
    user?.plan === "pro" ||
    user?.plan === "premium";

  const startPro = () => {
    if (!user) {
      navigate("/login?redirect=/pricing");
      return;
    }

    if (isPro) {
      navigate("/dashboard/subscription");
      return;
    }

    // Manual UPI payment + admin verification
    navigate("/payment");
  };

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-16 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-4 py-2 text-sm text-violet-200">
            <Sparkles size={16} />
            Simple AIForge pricing
          </div>

          <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-6xl">
            Upgrade your AI workflow
          </h1>

          <p className="mt-5 text-lg text-slate-400">
            Start free and upgrade to Pro when you need advanced AI tools,
            image generation and coding tools.
          </p>
        </div>

        <div className="mt-14 grid gap-8 lg:grid-cols-2">

          {/* FREE */}
          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Free</h2>
                <p className="mt-2 text-slate-400">
                  For getting started
                </p>
              </div>

              <div className="text-4xl font-bold">
                ₹0
              </div>
            </div>

            <div className="my-8 h-px bg-white/10" />

            <ul className="space-y-4">
              {freeTools.map((tool) => (
                <li key={tool} className="flex items-center gap-3">
                  <Check className="text-emerald-400" size={18} />
                  <span>{tool}</span>
                </li>
              ))}

              {proTools.slice(0, 4).map((tool) => (
                <li
                  key={tool}
                  className="flex items-center gap-3 text-slate-500"
                >
                  <Lock size={17} />
                  <span>{tool}</span>
                </li>
              ))}
            </ul>

            <Link
              to={user ? "/dashboard" : "/register"}
              className="mt-9 block rounded-2xl border border-white/10 px-5 py-3 text-center font-semibold transition hover:bg-white/10"
            >
              {user ? "Go to Dashboard" : "Get Started Free"}
            </Link>
          </section>


          {/* PRO */}
          <section className="relative overflow-hidden rounded-3xl border border-violet-400/40 bg-gradient-to-br from-violet-600/20 via-fuchsia-500/10 to-white/[0.04] p-8 shadow-2xl">
            <div className="absolute right-6 top-6 rounded-full bg-violet-500 px-3 py-1 text-xs font-bold">
              PRO
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-violet-500/20 p-3 text-violet-300">
                <Zap size={22} />
              </div>

              <div>
                <h2 className="text-2xl font-semibold">Pro</h2>
                <p className="mt-2 text-slate-400">
                  For serious AI productivity
                </p>
              </div>
            </div>

            <div className="mt-8 flex items-end gap-2">
              <span className="text-5xl font-bold">₹499</span>
              <span className="mb-2 text-slate-400">/ month</span>
            </div>

            <div className="my-8 h-px bg-white/10" />

            <ul className="space-y-4">
              {freeTools.map((tool) => (
                <li key={tool} className="flex items-center gap-3">
                  <Check className="text-emerald-400" size={18} />
                  <span>{tool}</span>
                </li>
              ))}

              {proTools.map((tool) => (
                <li key={tool} className="flex items-center gap-3">
                  <Check className="text-violet-300" size={18} />
                  <span>{tool}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={startPro}
              className="mt-9 flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 font-semibold transition hover:bg-violet-500"
            >
              {isPro ? "✓ Manage Pro Subscription" : "Upgrade to Pro — ₹499"}
            </button>

            <p className="mt-4 text-center text-xs text-slate-500">
              UPI payment • Admin verification • Pro activation
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}


export function Static({ title = "AIForge", children }) {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-16 text-white">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-400">AIForge</p>
        <h1 className="mt-4 text-4xl font-bold sm:text-6xl">{title}</h1>
        <div className="mt-8 text-slate-300">{children || <p>AIForge helps you write, summarize, translate, code and create with AI.</p>}</div>
      </div>
    </main>
  );
}

export function Blog() {
  const [posts, setPosts] = useState([]); const [loading,setLoading]=useState(true);
  useEffect(()=>{contentApi.blog().then(r=>setPosts(r.data?.posts||[])).catch(()=>{}).finally(()=>setLoading(false));},[]);
  return <main className="min-h-screen bg-slate-950 px-4 py-16 text-white"><div className="mx-auto max-w-6xl"><p className="text-sm font-semibold uppercase tracking-[.3em] text-violet-400">AIForge</p><h1 className="mt-3 text-4xl font-bold">AIForge Blog</h1><p className="mt-3 text-slate-400">AI tips, productivity ideas and product updates.</p>{loading?<div className="mt-10 text-slate-500">Loading posts...</div>:<div className="mt-10 grid gap-6 md:grid-cols-3">{posts.map(p=><article key={p.id} className="rounded-3xl border border-white/10 bg-white/[.04] p-6"><h2 className="text-xl font-semibold">{p.title}</h2><p className="mt-3 text-sm leading-6 text-slate-400">{p.excerpt}</p><Link to={`/blog/${p.slug}`} className="mt-5 inline-block text-sm font-semibold text-violet-400">Read more →</Link></article>)}</div>}</div></main>;
}

export function BlogPost(){ const {slug}=useParams(); const [post,setPost]=useState(null); const [loading,setLoading]=useState(true); useEffect(()=>{contentApi.blogPost(slug).then(r=>setPost(r.data?.post)).catch(()=>setPost(null)).finally(()=>setLoading(false));},[slug]); if(loading)return <Static title="Loading article…"/>; if(!post)return <Static title="Article not found"/>; return <main className="min-h-screen bg-slate-950 px-4 py-16 text-white"><article className="mx-auto max-w-3xl"><p className="text-sm text-violet-400">AIForge Blog</p><h1 className="mt-4 text-4xl font-bold sm:text-5xl">{post.title}</h1><p className="mt-4 text-slate-400">{post.excerpt}</p><div className="mt-10 whitespace-pre-wrap text-base leading-8 text-slate-200">{post.content}</div></article></main>; }

export function Contact(){ const [form,setForm]=useState({name:"",email:"",subject:"",message:""}); const [state,setState]=useState({loading:false,message:"",error:""}); const submit=async e=>{e.preventDefault();setState({loading:true,message:"",error:""});try{const r=await contentApi.contact(form);setState({loading:false,message:r.data.message,error:""});setForm({name:"",email:"",subject:"",message:""});}catch(err){setState({loading:false,message:"",error:err.response?.data?.message||"Could not send message."});}}; return <Static title="Contact AIForge"><div className="max-w-2xl"><p>Have a question or need help? Send us a message.</p>{state.message&&<div className="mt-5 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-emerald-200">{state.message}</div>}{state.error&&<div className="mt-5 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-red-200">{state.error}</div>}<form onSubmit={submit} className="mt-8 space-y-4">{[["name","Name"],["email","Email"],["subject","Subject"]].map(([k,l])=><input key={k} required={k!=="subject"} type={k==="email"?"email":"text"} value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})} placeholder={l} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-violet-400"/>)}<textarea required rows="6" value={form.message} onChange={e=>setForm({...form,message:e.target.value})} placeholder="Message" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-violet-400"/><button disabled={state.loading} className="w-full rounded-xl bg-violet-600 px-5 py-3 font-semibold disabled:opacity-50">{state.loading?"Sending…":"Send Message"}</button></form></div></Static>; }

export function FAQ(){ const [faqs,setFaqs]=useState([]); useEffect(()=>{contentApi.faqs().then(r=>setFaqs(r.data?.faqs||[])).catch(()=>{});},[]); return <Static title="Frequently Asked Questions"><div className="space-y-4">{faqs.map(f=><details key={f.id} className="rounded-2xl border border-white/10 bg-white/[.04] p-5"><summary className="cursor-pointer font-semibold">{f.question}</summary><p className="mt-3 leading-7 text-slate-400">{f.answer}</p></details>)}</div></Static>; }

export function Legal({type}){ const privacy=type==='privacy'; return <Static title={privacy?'Privacy Policy':'Terms & Conditions'}><div className="space-y-6 leading-8 text-slate-400"><p>{privacy?'AIForge only uses account information needed to provide authentication, AI tools, credits, support and payment verification.':'By using AIForge, you agree to use the service lawfully and not abuse, overload or attempt to compromise the platform.'}</p><p>{privacy?'Passwords are stored as secure hashes and API secrets remain on the server. You can contact us to request account assistance.':'AI-generated output should be reviewed by you before publication or use. Premium access is activated after payment verification and may expire according to the selected plan.'}</p></div></Static>; }
