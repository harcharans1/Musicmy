import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Copy, ExternalLink, ShieldCheck } from "lucide-react";
import { paymentApi } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function PaymentPage() {
  const { user } = useAuth();

  const [config, setConfig] = useState(null);
  const [utr, setUtr] = useState("");
  const [note, setNote] = useState("");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        const configResponse = await paymentApi.config();

        if (!active) return;
        setConfig(configResponse.data);

        if (user) {
          const historyResponse = await paymentApi.myRequests();
          if (active) {
            setRequests(historyResponse.data?.requests || []);
          }
        }
      } catch (err) {
        if (active) {
          setError(
            err?.response?.data?.message ||
              "Unable to load payment details."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [user]);

  const upiId = config?.upiId || "";
  const amount = Number(config?.amount || 499);

  const upiLink = useMemo(() => {
    if (!upiId) return "";

    const params = new URLSearchParams({
      pa: upiId,
      pn: config?.merchantName || "AIForge",
      am: String(amount),
      cu: "INR",
      tn: "AIForge Pro - 1 Month",
    });

    return `upi://pay?${params.toString()}`;
  }, [upiId, amount, config?.merchantName]);

  const qrUrl = useMemo(() => {
    if (!upiLink) return "";

    return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(
      upiLink
    )}`;
  }, [upiLink]);

  const copyUpi = async () => {
    if (!upiId) return;

    await navigator.clipboard.writeText(upiId);
    setMessage("UPI ID copied.");
    setError("");
  };

  const submit = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");

    if (!user) {
      setError("Please login before submitting a payment.");
      return;
    }

    if (!utr.trim()) {
      setError("Please enter your UTR / transaction ID.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await paymentApi.submitRequest({
        utr: utr.trim(),
        note: note.trim(),
      });

      setMessage(
        response.data?.message ||
          "Payment request submitted for verification."
      );
      setUtr("");
      setNote("");

      const historyResponse = await paymentApi.myRequests();
      setRequests(historyResponse.data?.requests || []);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Unable to submit payment request."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-16 text-white">
        <div className="mx-auto max-w-3xl animate-pulse rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          Loading payment details...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-12 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-violet-400">
            AIForge Pro
          </p>
          <h1 className="mt-3 text-4xl font-bold">
            Pay ₹{amount} using UPI
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-slate-400">
            Scan the QR, complete the payment, then submit your UTR.
            Your Pro access will be activated only after admin verification.
          </p>
        </div>

        {message && (
          <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-emerald-200">
            {message}
          </div>
        )}

        {error && (
          <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-red-200">
            {error}
          </div>
        )}

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-8">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-emerald-400" />
              <h2 className="text-xl font-semibold">1. Make payment</h2>
            </div>

            <div className="mt-7 flex justify-center">
              {qrUrl ? (
                <div className="rounded-3xl bg-white p-5">
                  <img
                    src={qrUrl}
                    alt="AIForge UPI payment QR"
                    className="h-64 w-64"
                  />
                </div>
              ) : (
                <div className="flex h-64 w-64 items-center justify-center rounded-3xl border border-dashed border-white/20 text-center text-sm text-slate-500">
                  Admin has not configured the UPI ID yet.
                </div>
              )}
            </div>

            <div className="mt-7 rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              <p className="text-xs uppercase tracking-wider text-slate-500">
                UPI ID
              </p>

              <div className="mt-2 flex items-center justify-between gap-3">
                <code className="break-all text-lg font-semibold text-violet-300">
                  {upiId || "Not configured"}
                </code>

                <button
                  type="button"
                  onClick={copyUpi}
                  disabled={!upiId}
                  className="rounded-xl border border-white/10 p-2 hover:bg-white/10 disabled:opacity-40"
                  title="Copy UPI ID"
                >
                  <Copy size={17} />
                </button>
              </div>
            </div>

            {upiLink && (
              <a
                href={upiLink}
                className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-white/10 px-5 py-3 font-semibold hover:bg-white/10"
              >
                Open UPI App <ExternalLink size={17} />
              </a>
            )}
          </section>

          <section className="rounded-3xl border border-violet-400/30 bg-violet-500/[0.07] p-8">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-violet-300" />
              <h2 className="text-xl font-semibold">2. Submit payment</h2>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-400">
              After paying, enter the UTR / transaction ID shown in your UPI
              app. Do not submit fake transaction details.
            </p>

            <form onSubmit={submit} className="mt-7 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  UTR / Transaction ID
                </label>
                <input
                  value={utr}
                  onChange={(e) => setUtr(e.target.value)}
                  placeholder="Enter UTR / transaction ID"
                  className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Note (optional)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="Any payment note"
                  className="w-full resize-none rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !user}
                className="w-full rounded-2xl bg-violet-600 px-5 py-3 font-semibold hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit for Verification"}
              </button>
            </form>

            <div className="mt-6 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-200">
              Pro access is <strong>not</strong> activated automatically.
              An admin must verify your payment first.
            </div>
          </section>
        </div>

        {requests.length > 0 && (
          <section className="mt-10 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <h2 className="text-xl font-semibold">Your payment requests</h2>

            <div className="mt-5 space-y-3">
              {requests.map((request) => (
                <div
                  key={request.id}
                  className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-900/50 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-semibold">
                      ₹{request.amount} · UTR {request.utr}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {request.created_at
                        ? new Date(request.created_at).toLocaleString()
                        : ""}
                    </p>
                  </div>

                  <span
                    className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                      request.status === "approved"
                        ? "bg-emerald-400/10 text-emerald-300"
                        : request.status === "rejected"
                        ? "bg-red-400/10 text-red-300"
                        : "bg-amber-400/10 text-amber-300"
                    }`}
                  >
                    {String(request.status).toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
