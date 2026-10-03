import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Copy,
  Download,
  Trash2,
  Eye,
  X,
  RefreshCw,
  Clock3,
  Sparkles,
  Heart,
  BarChart3,
  CreditCard,
  User,
  CalendarDays,
} from "lucide-react";
import { userApi } from "../services/api";

const Page = ({ title, children }) => (
  <div>
    <p className="text-xs uppercase tracking-[.2em] text-violet-400">
      Account
    </p>
    <h1 className="mt-2 text-3xl font-black">{title}</h1>
    <div className="mt-8">{children}</div>
  </div>
);

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getContent(item) {
  return item?.content || item?.answer || item?.output || "";
}

function getTitle(item) {
  return item?.title || item?.slug || "AI Generation";
}

function getFavoriteGenerationId(item) {
  return (
    item?.generation_id ||
    item?.generationId ||
    item?.generation?.id ||
    item?.data?.generation_id ||
    null
  );
}

function LoadingBox({ text = "Loading..." }) {
  return (
    <div className="glass rounded-2xl p-12 text-center">
      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-violet-400/20 border-t-violet-400" />
      <p className="mt-4 text-sm text-slate-500">{text}</p>
    </div>
  );
}

function ErrorBox({ message }) {
  if (!message) return null;
  return (
    <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
      {message}
    </div>
  );
}

function EmptyBox({ icon: Icon = Sparkles, title, text }) {
  return (
    <div className="glass mt-5 rounded-2xl p-12 text-center">
      <Icon size={32} className="mx-auto text-slate-600" />
      <h2 className="mt-4 font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-slate-500">{text}</p>
    </div>
  );
}

function useAccountProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await userApi.profile();
      setProfile(response.data?.user || null);
    } catch (err) {
      console.error("Profile load error:", err);
      setError(
        err.response?.data?.message || "Failed to load account details."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return { profile, loading, error, reload: load };
}

export const History = () => {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const loadHistory = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await userApi.history();
      setItems(response.data?.generations || []);
    } catch (err) {
      console.error("History load error:", err);
      setError(
        err.response?.data?.message || "Failed to load history."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const filteredItems = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return items;

    return items.filter((item) => {
      const title = getTitle(item).toLowerCase();
      const content = getContent(item).toLowerCase();
      const slug = String(item?.slug || "").toLowerCase();
      return (
        title.includes(value) ||
        content.includes(value) ||
        slug.includes(value)
      );
    });
  }, [items, search]);

  const copyItem = async (item) => {
    const content = getContent(item);
    if (!content) return;

    try {
      await navigator.clipboard.writeText(content);
    } catch (err) {
      console.error("Copy failed:", err);
      alert("Copy failed. Please try again.");
    }
  };

  const downloadItem = (item) => {
    const content = getContent(item);
    if (!content) return;

    const blob = new Blob([content], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${item?.slug || "aiforge"}-${item?.id || "output"}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const deleteItem = async (id) => {
    if (!window.confirm("Delete this generation from your history?")) return;

    setDeleting(id);
    try {
      await userApi.deleteHistory(id);
      setItems((current) => current.filter((item) => item.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch (err) {
      console.error("Delete history error:", err);
      alert(
        err.response?.data?.message || "Failed to delete history."
      );
    } finally {
      setDeleting(null);
    }
  };

  return (
    <Page title="My History">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={17}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your AI history..."
            className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm outline-none focus:border-violet-500/50"
          />
        </div>

        <button
          onClick={loadHistory}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10 disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      <ErrorBox message={error} />

      {loading && (
        <div className="mt-5">
          <LoadingBox text="Loading your history..." />
        </div>
      )}

      {!loading && filteredItems.length === 0 && (
        <EmptyBox
          title={search ? "No matching history" : "No AI history yet"}
          text={
            search
              ? "Try another search."
              : "Your AI generations will appear here."
          }
        />
      )}

      {!loading && filteredItems.length > 0 && (
        <div className="mt-5 space-y-3">
          {filteredItems.map((item) => {
            const content = getContent(item);

            return (
              <div key={item.id} className="glass rounded-2xl p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold">
                      {getTitle(item)}
                    </h3>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Clock3 size={13} />
                        {formatDate(item.created_at)}
                      </span>

                      {item.slug && (
                        <span className="rounded-full bg-violet-500/10 px-2 py-1 text-violet-300">
                          {item.slug}
                        </span>
                      )}

                      <span>
                        {Number(item.amount || 0)} credit
                        {Number(item.amount || 0) === 1 ? "" : "s"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelected(item)}
                      title="View"
                      className="rounded-lg border border-white/10 p-2 text-slate-400 hover:bg-white/5 hover:text-violet-300"
                    >
                      <Eye size={16} />
                    </button>

                    <button
                      onClick={() => copyItem(item)}
                      disabled={!content}
                      title="Copy"
                      className="rounded-lg border border-white/10 p-2 text-slate-400 hover:bg-white/5 hover:text-violet-300 disabled:opacity-30"
                    >
                      <Copy size={16} />
                    </button>

                    <button
                      onClick={() => downloadItem(item)}
                      disabled={!content}
                      title="Download"
                      className="rounded-lg border border-white/10 p-2 text-slate-400 hover:bg-white/5 hover:text-violet-300 disabled:opacity-30"
                    >
                      <Download size={16} />
                    </button>

                    <button
                      onClick={() => deleteItem(item.id)}
                      disabled={deleting === item.id}
                      title="Delete"
                      className="rounded-lg border border-red-500/10 p-2 text-slate-400 hover:bg-red-500/10 hover:text-red-300 disabled:opacity-30"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="mt-4 line-clamp-2 rounded-xl border border-white/5 bg-black/20 p-4 text-sm leading-6 text-slate-400">
                  {content || "No output content available."}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-5 backdrop-blur-sm">
          <div className="glass max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-2xl">
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <div className="min-w-0">
                <h2 className="truncate font-semibold">
                  {getTitle(selected)}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {formatDate(selected.created_at)}
                </p>
              </div>

              <button
                onClick={() => setSelected(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-white/5"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[65vh] overflow-y-auto whitespace-pre-wrap break-words p-6 text-sm leading-7 text-slate-300">
              {getContent(selected) || "No content available."}
            </div>

            <div className="flex justify-end gap-2 border-t border-white/10 p-4">
              <button
                onClick={() => copyItem(selected)}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/5"
              >
                <Copy size={15} />
                Copy
              </button>

              <button
                onClick={() => downloadItem(selected)}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-500 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-400"
              >
                <Download size={15} />
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
};

export const Favorites = () => {
  const [favorites, setFavorites] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  const loadFavorites = async () => {
    setLoading(true);
    setError("");

    try {
      const [favoriteResponse, historyResponse] = await Promise.all([
        userApi.favorites(),
        userApi.history(),
      ]);

      const favoriteRows = favoriteResponse.data?.favorites || [];
      const historyRows = historyResponse.data?.generations || [];

      const resolved = favoriteRows.map((favorite) => {
        const generationId = getFavoriteGenerationId(favorite);
        const generation = historyRows.find(
          (item) => String(item.id) === String(generationId)
        );

        return {
          ...favorite,
          ...(generation || {}),
          favorite_id: favorite.id,
          generation_id: generationId,
        };
      });

      setFavorites(resolved);
      setHistory(historyRows);
    } catch (err) {
      console.error("Favorites load error:", err);
      setError(
        err.response?.data?.message || "Failed to load favorites."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  const copyItem = async (item) => {
    const content = getContent(item);
    if (!content) return;

    try {
      await navigator.clipboard.writeText(content);
    } catch (err) {
      console.error("Copy failed:", err);
      alert("Copy failed. Please try again.");
    }
  };

  const downloadItem = (item) => {
    const content = getContent(item);
    if (!content) return;

    const blob = new Blob([content], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${item?.slug || "favorite"}-${item?.id || "output"}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <Page title="Favorites">
      <div className="flex justify-end">
        <button
          onClick={loadFavorites}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10 disabled:opacity-50"
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      <ErrorBox message={error} />

      {loading && (
        <div className="mt-5">
          <LoadingBox text="Loading your favorites..." />
        </div>
      )}

      {!loading && favorites.length === 0 && (
        <EmptyBox
          icon={Heart}
          title="No favorites yet"
          text="Favorite generations will appear here."
        />
      )}

      {!loading && favorites.length > 0 && (
        <div className="mt-5 space-y-3">
          {favorites.map((item) => {
            const content = getContent(item);
            const hasGeneration = Boolean(
              item?.generation_id || item?.content || item?.answer
            );

            return (
              <div key={item.favorite_id || item.id} className="glass rounded-2xl p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Heart size={16} className="fill-current text-pink-400" />
                      <h3 className="truncate font-semibold">
                        {getTitle(item)}
                      </h3>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Clock3 size={13} />
                        {formatDate(item.created_at)}
                      </span>

                      {item.generation_id && (
                        <span>
                          Generation: {item.generation_id}
                        </span>
                      )}
                    </div>
                  </div>

                  {hasGeneration && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelected(item)}
                        title="View"
                        className="rounded-lg border border-white/10 p-2 text-slate-400 hover:bg-white/5 hover:text-violet-300"
                      >
                        <Eye size={16} />
                      </button>

                      <button
                        onClick={() => copyItem(item)}
                        disabled={!content}
                        title="Copy"
                        className="rounded-lg border border-white/10 p-2 text-slate-400 hover:bg-white/5 hover:text-violet-300 disabled:opacity-30"
                      >
                        <Copy size={16} />
                      </button>

                      <button
                        onClick={() => downloadItem(item)}
                        disabled={!content}
                        title="Download"
                        className="rounded-lg border border-white/10 p-2 text-slate-400 hover:bg-white/5 hover:text-violet-300 disabled:opacity-30"
                      >
                        <Download size={16} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-4 line-clamp-2 rounded-xl border border-white/5 bg-black/20 p-4 text-sm leading-6 text-slate-400">
                  {content ||
                    (item.generation_id
                      ? "This favorite points to a generation that is not available in your current history."
                      : "Favorite metadata available, but no output content is stored on this row.")}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-5 backdrop-blur-sm">
          <div className="glass max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-2xl">
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <div className="min-w-0">
                <h2 className="truncate font-semibold">
                  {getTitle(selected)}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {formatDate(selected.created_at)}
                </p>
              </div>

              <button
                onClick={() => setSelected(null)}
                className="rounded-lg p-2 text-slate-400 hover:bg-white/5"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[65vh] overflow-y-auto whitespace-pre-wrap break-words p-6 text-sm leading-7 text-slate-300">
              {getContent(selected) || "No content available."}
            </div>

            <div className="flex justify-end gap-2 border-t border-white/10 p-4">
              <button
                onClick={() => copyItem(selected)}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/5"
              >
                <Copy size={15} />
                Copy
              </button>

              <button
                onClick={() => downloadItem(selected)}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-500 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-400"
              >
                <Download size={15} />
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
};

export const Usage = () => {
  const [usage, setUsage] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadUsage = async () => {
    setLoading(true);
    setError("");

    try {
      const [usageResponse, profileResponse] = await Promise.all([
        userApi.usage(),
        userApi.profile(),
      ]);

      setUsage(usageResponse.data || null);
      setProfile(profileResponse.data?.user || null);
    } catch (err) {
      console.error("Usage load error:", err);
      setError(
        err.response?.data?.message || "Failed to load usage."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsage();
  }, []);

  if (loading) {
    return (
      <Page title="Usage & Credits">
        <LoadingBox text="Loading usage..." />
      </Page>
    );
  }

  return (
    <Page title="Usage & Credits">
      <div className="flex justify-end">
        <button
          onClick={loadUsage}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <ErrorBox message={error} />

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="glass rounded-2xl p-6">
          <CreditCard className="text-violet-300" size={22} />
          <p className="mt-4 text-sm text-slate-500">Credits Remaining</p>
          <p className="mt-2 text-3xl font-black">
            {Number(profile?.credits || 0)}
          </p>
        </div>

        <div className="glass rounded-2xl p-6">
          <BarChart3 className="text-violet-300" size={22} />
          <p className="mt-4 text-sm text-slate-500">Credits Used</p>
          <p className="mt-2 text-3xl font-black">
            {Number(usage?.creditsUsed || 0)}
          </p>
        </div>

        <div className="glass rounded-2xl p-6">
          <Sparkles className="text-violet-300" size={22} />
          <p className="mt-4 text-sm text-slate-500">Generations</p>
          <p className="mt-2 text-3xl font-black">
            {Number(usage?.generations || 0)}
          </p>
        </div>
      </div>

      <div className="glass mt-5 rounded-2xl p-6">
        <div className="flex items-center gap-3">
          <BarChart3 size={20} className="text-violet-300" />
          <div>
            <h2 className="font-semibold">Usage overview</h2>
            <p className="mt-1 text-sm text-slate-500">
              Your usage is calculated from completed AI generations.
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
          Current plan:{" "}
          <span className="font-semibold text-white">
            {profile?.plan || "free"}
          </span>
        </div>
      </div>
    </Page>
  );
};

export const Subscription = () => {
  const { profile, loading, error, reload } = useAccountProfile();

  if (loading) {
    return (
      <Page title="Subscription">
        <LoadingBox text="Loading subscription..." />
      </Page>
    );
  }

  return (
    <Page title="Subscription">
      <div className="flex justify-end">
        <button
          onClick={reload}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <ErrorBox message={error} />

      <div className="glass mt-5 max-w-2xl rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[.2em] text-violet-400">
              Current Plan
            </p>
            <h2 className="mt-2 text-3xl font-black capitalize">
              {profile?.plan || "free"} Plan
            </h2>
          </div>

          <CreditCard className="text-violet-300" size={28} />
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-slate-500">Available credits</p>
            <p className="mt-1 text-xl font-bold">
              {Number(profile?.credits || 0)}
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-slate-500">Account created</p>
            <p className="mt-1 text-sm font-semibold">
              {formatDate(profile?.created_at) || "—"}
            </p>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-violet-500/10 bg-violet-500/5 p-4 text-sm leading-6 text-slate-400">
          Plan and credit information is loaded from your account. Payment
          and subscription upgrade management can be connected separately.
        </div>
      </div>
    </Page>
  );
};

export const Settings = () => {
  const { profile, loading, error, reload } = useAccountProfile();

  if (loading) {
    return (
      <Page title="Account Settings">
        <LoadingBox text="Loading account settings..." />
      </Page>
    );
  }

  return (
    <Page title="Account Settings">
      <div className="flex justify-end">
        <button
          onClick={reload}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <ErrorBox message={error} />

      <div className="glass mt-5 max-w-2xl rounded-2xl p-6">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-violet-500/10 text-violet-300">
            <User size={21} />
          </div>
          <div>
            <h2 className="font-semibold">Profile information</h2>
            <p className="text-sm text-slate-500">
              Your current account details.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-xs text-slate-500">
              Name
            </label>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
              {profile?.name || "—"}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs text-slate-500">
              Email
            </label>
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
              {profile?.email || "—"}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs text-slate-500">
                Plan
              </label>
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm capitalize">
                {profile?.plan || "free"}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs text-slate-500">
                Role
              </label>
              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm capitalize">
                {profile?.role || "user"}
              </div>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs text-slate-500">
              Member since
            </label>
            <div className="inline-flex w-full items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
              <CalendarDays size={16} className="text-violet-300" />
              {formatDate(profile?.created_at) || "—"}
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-slate-500">
          Profile editing is not enabled yet because the current backend
          profile-update route is only a placeholder. This page intentionally
          does not show a fake save action.
        </div>
      </div>
    </Page>
  );
};
