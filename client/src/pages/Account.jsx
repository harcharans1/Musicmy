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
} from "lucide-react";

import { userApi } from "../services/api";

const Page = ({ title, children }) => (
  <div>
    <p className="text-xs uppercase tracking-[.2em] text-violet-400">
      Account
    </p>

    <h1 className="mt-2 text-3xl font-black">
      {title}
    </h1>

    <div className="mt-8">
      {children}
    </div>
  </div>
);

function formatDate(value) {
  if (!value) return "";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getContent(item) {
  return (
    item.content ||
    item.answer ||
    ""
  );
}

function getTitle(item) {
  return (
    item.title ||
    item.slug ||
    "AI Generation"
  );
}

export const History = () => {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] =
    useState(null);
  const [deleting, setDeleting] =
    useState(null);

  const loadHistory = async () => {
    setLoading(true);
    setError("");

    try {
      const response =
        await userApi.history();

      setItems(
        response.data?.generations || []
      );
    } catch (err) {
      console.error(
        "History load error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to load history."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const filteredItems = useMemo(() => {
    const value =
      search.trim().toLowerCase();

    if (!value) return items;

    return items.filter((item) => {
      const title =
        getTitle(item).toLowerCase();

      const content =
        getContent(item).toLowerCase();

      const slug =
        String(
          item.slug || ""
        ).toLowerCase();

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
      await navigator.clipboard.writeText(
        content
      );
    } catch (err) {
      console.error(
        "Copy failed:",
        err
      );
    }
  };

  const downloadItem = (item) => {
    const content = getContent(item);

    if (!content) return;

    const blob = new Blob([content], {
      type: "text/plain;charset=utf-8",
    });

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download = `${
      item.slug || "aiforge"
    }-${item.id}.txt`;

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);
  };

  const deleteItem = async (id) => {
    const confirmed =
      window.confirm(
        "Delete this generation from your history?"
      );

    if (!confirmed) return;

    setDeleting(id);

    try {
      await userApi.deleteHistory(id);

      setItems((current) =>
        current.filter(
          (item) => item.id !== id
        )
      );

      if (selected?.id === id) {
        setSelected(null);
      }
    } catch (err) {
      console.error(
        "Delete history error:",
        err
      );

      alert(
        err.response?.data?.message ||
          "Failed to delete history."
      );
    } finally {
      setDeleting(null);
    }
  };

  return (
    <Page title="My History">
      {/* SEARCH + REFRESH */}

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={17}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
          />

          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search your AI history..."
            className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm outline-none focus:border-violet-500/50"
          />
        </div>

        <button
          onClick={loadHistory}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10"
        >
          <RefreshCw
            size={16}
            className={
              loading
                ? "animate-spin"
                : ""
            }
          />

          Refresh
        </button>
      </div>

      {/* ERROR */}

      {error && (
        <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* LOADING */}

      {loading && (
        <div className="glass mt-5 rounded-2xl p-12 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-violet-400/20 border-t-violet-400" />

          <p className="mt-4 text-sm text-slate-500">
            Loading your history...
          </p>
        </div>
      )}

      {/* EMPTY */}

      {!loading &&
        filteredItems.length === 0 && (
          <div className="glass mt-5 rounded-2xl p-12 text-center">
            <Sparkles
              size={32}
              className="mx-auto text-slate-600"
            />

            <h2 className="mt-4 font-semibold">
              {search
                ? "No matching history"
                : "No AI history yet"}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              {search
                ? "Try another search."
                : "Your AI generations will appear here."}
            </p>
          </div>
        )}

      {/* HISTORY LIST */}

      {!loading &&
        filteredItems.length > 0 && (
          <div className="mt-5 space-y-3">
            {filteredItems.map(
              (item) => {
                const content =
                  getContent(item);

                return (
                  <div
                    key={item.id}
                    className="glass rounded-2xl p-5"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold">
                          {getTitle(item)}
                        </h3>

                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <Clock3 size={13} />

                            {formatDate(
                              item.created_at
                            )}
                          </span>

                          {item.slug && (
                            <span className="rounded-full bg-violet-500/10 px-2 py-1 text-violet-300">
                              {item.slug}
                            </span>
                          )}

                          <span>
                            -
                            {Number(
                              item.amount || 0
                            )}{" "}
                            credit
                            {Number(
                              item.amount || 0
                            ) === 1
                              ? ""
                              : "s"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            setSelected(
                              item
                            )
                          }
                          title="View"
                          className="rounded-lg border border-white/10 p-2 text-slate-400 hover:bg-white/5 hover:text-violet-300"
                        >
                          <Eye
                            size={16}
                          />
                        </button>

                        <button
                          onClick={() =>
                            copyItem(item)
                          }
                          disabled={!content}
                          title="Copy"
                          className="rounded-lg border border-white/10 p-2 text-slate-400 hover:bg-white/5 hover:text-violet-300 disabled:opacity-30"
                        >
                          <Copy
                            size={16}
                          />
                        </button>

                        <button
                          onClick={() =>
                            downloadItem(
                              item
                            )
                          }
                          disabled={!content}
                          title="Download"
                          className="rounded-lg border border-white/10 p-2 text-slate-400 hover:bg-white/5 hover:text-violet-300 disabled:opacity-30"
                        >
                          <Download
                            size={16}
                          />
                        </button>

                        <button
                          onClick={() =>
                            deleteItem(
                              item.id
                            )
                          }
                          disabled={
                            deleting ===
                            item.id
                          }
                          title="Delete"
                          className="rounded-lg border border-red-500/10 p-2 text-slate-400 hover:bg-red-500/10 hover:text-red-300 disabled:opacity-30"
                        >
                          <Trash2
                            size={16}
                          />
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 line-clamp-2 rounded-xl border border-white/5 bg-black/20 p-4 text-sm leading-6 text-slate-400">
                      {content ||
                        "No output content available."}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}

      {/* VIEW MODAL */}

      {selected && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-5 backdrop-blur-sm">
          <div className="glass max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-2xl">
            <div className="flex items-center justify-between border-b border-white/10 p-5">
              <div className="min-w-0">
                <h2 className="truncate font-semibold">
                  {getTitle(selected)}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  {formatDate(
                    selected.created_at
                  )}
                </p>
              </div>

              <button
                onClick={() =>
                  setSelected(null)
                }
                className="rounded-lg p-2 text-slate-400 hover:bg-white/5"
              >
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[65vh] overflow-y-auto whitespace-pre-wrap break-words p-6 text-sm leading-7 text-slate-300">
              {getContent(selected) ||
                "No content available."}
            </div>

            <div className="flex justify-end gap-2 border-t border-white/10 p-4">
              <button
                onClick={() =>
                  copyItem(selected)
                }
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/5"
              >
                <Copy size={15} />
                Copy
              </button>

              <button
                onClick={() =>
                  downloadItem(selected)
                }
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

export const Favorites = () => (
  <Page title="Favorites">
    <div className="glass rounded-2xl p-8 text-center text-sm text-slate-500">
      Favorites live integration next.
    </div>
  </Page>
);

export const Usage = () => (
  <Page title="Usage & Credits">
    <div className="glass rounded-2xl p-8 text-center text-sm text-slate-500">
      Usage live integration next.
    </div>
  </Page>
);

export const Subscription = () => (
  <Page title="Subscription">
    <div className="glass rounded-2xl p-6">
      <h2 className="text-2xl font-bold">
        Free Plan
      </h2>

      <p className="mt-2 text-sm text-slate-500">
        Your subscription details will
        appear here.
      </p>
    </div>
  </Page>
);

export const Settings = () => (
  <Page title="Account Settings">
    <div className="glass max-w-xl rounded-2xl p-6">
      <p className="text-sm text-slate-500">
        Settings live integration next.
      </p>
    </div>
  </Page>
);