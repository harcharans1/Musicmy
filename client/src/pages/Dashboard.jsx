import { useEffect, useState } from "react";
import {
  BarChart3, Bot, CreditCard, FileText, Image, Languages,
  RefreshCw, Sparkles, Heart, Clock3,
} from "lucide-react";
import { Link } from "react-router-dom";
import { userApi } from "../services/api";

const quickActions = [
  ["AI Writer", FileText, "ai-writer"],
  ["AI Image Generator", Image, "ai-image-generator"],
  ["Summarizer", Bot, "ai-summarizer"],
  ["Translator", Languages, "ai-translator"],
];

function formatDate(value) {
  if (!value) return "Just now";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(value));
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = async () => {
    setBusy(true);
    setError("");
    try {
      const response = await userApi.dashboard();
      setData(response.data);
    } catch (err) {
      console.error("Dashboard error:", err);
      setError(err.response?.data?.message || "Unable to load dashboard.");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { loadDashboard(); }, []);

  if (busy && !data) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-violet-400/20 border-t-violet-400" />
          <p className="mt-4 text-sm text-slate-500">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="glass rounded-2xl p-8 text-center">
        <p className="text-red-400">{error}</p>
        <button onClick={loadDashboard}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-500 px-4 py-2 text-sm font-semibold">
          <RefreshCw size={15} /> Try again
        </button>
      </div>
    );
  }

  const user = data?.user;
  const stats = data?.stats || {};
  const recentActivity = data?.recentActivity || [];
  const cards = [
    ["Credits Remaining", stats.creditsRemaining ?? 0, CreditCard],
    ["Tools Used", stats.toolsUsed ?? 0, Bot],
    ["Saved Outputs", stats.savedOutputs ?? 0, FileText],
    ["Favorites", stats.favorites ?? 0, Heart],
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[.2em] text-violet-400">Workspace</p>
          <h1 className="mt-2 text-3xl font-black">
            Good evening, {user?.name?.split(" ")[0] || "Creator"} 👋
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Your AIForge workspace is connected to live account data.
          </p>
        </div>
        <button onClick={loadDashboard} disabled={busy}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 hover:bg-white/10 disabled:opacity-50">
          <RefreshCw size={15} className={busy ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {error && <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">{error}</div>}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(([label, value, Icon]) => (
          <div className="glass rounded-2xl p-5" key={label}>
            <Icon className="text-violet-300" />
            <p className="mt-5 text-xs text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Quick actions</h2>
        <Link to="/dashboard/tools" className="text-xs text-violet-300">View all tools →</Link>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quickActions.map(([name, Icon, slug]) => (
          <Link to={`/ai-tools/${slug}`}
            className="glass rounded-2xl p-5 transition hover:-translate-y-0.5 hover:border-violet-500/30"
            key={slug}>
            <Icon className="text-violet-300" />
            <h3 className="mt-5 font-semibold">{name}</h3>
            <p className="mt-2 text-xs text-slate-500">Open workspace</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Recent Activity</h2>
              <p className="mt-1 text-xs text-slate-500">Your latest AI generations</p>
            </div>
            <Clock3 size={18} className="text-violet-300" />
          </div>

          {recentActivity.length > 0 ? (
            <div className="mt-3">
              {recentActivity.map((item) => (
                <div key={item.id}
                  className="flex items-center justify-between gap-4 border-b border-white/5 py-4 last:border-b-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-slate-200">
                      {item.title || item.slug || "AI Generation"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">{formatDate(item.created_at)}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-violet-500/10 px-2.5 py-1 text-[11px] text-violet-300">
                    -{Number(item.amount || 0)} credit{Number(item.amount || 0) === 1 ? "" : "s"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <Sparkles className="mx-auto text-slate-600" size={25} />
              <p className="mt-3 text-sm text-slate-500">No AI activity yet.</p>
              <Link to="/ai-tools/ai-writer" className="mt-4 inline-block text-sm text-violet-300">
                Create your first generation →
              </Link>
            </div>
          )}
        </div>

        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Usage this month</h2>
              <p className="mt-1 text-xs text-slate-500">Based on real AI generations</p>
            </div>
            <BarChart3 size={18} className="text-violet-300" />
          </div>

          <div className="mt-8 h-3 overflow-hidden rounded-full bg-white/5">
            <div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-cyan-400 transition-all"
              style={{ width: `${stats.usagePercent || 0}%` }} />
          </div>

          <div className="mt-3 flex justify-between text-xs text-slate-500">
            <span>{stats.creditsUsedThisMonth || 0} credits used</span>
            <span>{stats.creditBase || 0} total cycle</span>
          </div>

          <div className="mt-8 rounded-xl border border-white/5 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-wider text-slate-500">Current plan</p>
            <div className="mt-2 flex items-center justify-between">
              <p className="font-semibold capitalize">{user?.plan || "free"}</p>
              <Link to="/dashboard/subscription" className="text-xs text-violet-300">Manage plan →</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
