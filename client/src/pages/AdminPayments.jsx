import { useEffect, useState } from "react";
import { Check, RefreshCw, X } from "lucide-react";
import { adminPaymentApi } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function AdminPayments() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [status, setStatus] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = async () => {
    if (user?.role !== "admin") return;

    try {
      setLoading(true);
      setError("");

      const response = await adminPaymentApi.list(status);
      setRequests(response.data?.requests || []);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Unable to load payment requests."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [status, user?.role]);

  const approve = async (id) => {
    if (!window.confirm("Verify the payment and activate Pro?")) return;

    try {
      setActionId(id);
      setError("");
      setMessage("");

      const response = await adminPaymentApi.approve(id);

      setMessage(
        response.data?.message ||
          "Payment approved and Pro activated."
      );

      await load();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Unable to approve payment."
      );
    } finally {
      setActionId("");
    }
  };

  const reject = async (id) => {
    const reason =
      window.prompt(
        "Reason for rejection:",
        "Payment could not be verified."
      ) || "Payment could not be verified.";

    try {
      setActionId(id);
      setError("");
      setMessage("");

      const response = await adminPaymentApi.reject(id, reason);

      setMessage(
        response.data?.message ||
          "Payment request rejected."
      );

      await load();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Unable to reject payment."
      );
    } finally {
      setActionId("");
    }
  };

  if (user?.role !== "admin") {
    return (
      <main className="min-h-screen bg-slate-950 px-4 py-16 text-white">
        <div className="mx-auto max-w-3xl rounded-3xl border border-red-400/20 bg-red-400/10 p-8 text-center text-red-200">
          Admin access required.
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-12 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-violet-400">
              Admin
            </p>
            <h1 className="mt-2 text-3xl font-bold">
              Payment Verification
            </h1>
            <p className="mt-2 text-slate-400">
              Check the UTR against your UPI/bank transaction before approving.
            </p>
          </div>

          <button
            type="button"
            onClick={load}
            className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 px-4 py-3 hover:bg-white/10"
          >
            <RefreshCw size={17} />
            Refresh
          </button>
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          {["pending", "approved", "rejected", "all"].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setStatus(item)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                status === item
                  ? "bg-violet-600"
                  : "border border-white/10 bg-white/[0.04]"
              }`}
            >
              {item[0].toUpperCase() + item.slice(1)}
            </button>
          ))}
        </div>

        {message && (
          <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-emerald-200">
            {message}
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-red-200">
            {error}
          </div>
        )}

        <div className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
          {loading ? (
            <div className="p-8 text-slate-400">
              Loading payment requests...
            </div>
          ) : requests.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              No payment requests found.
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {requests.map((request) => (
                <div key={request.id} className="p-6">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-lg font-semibold">
                        {request.users?.name ||
                          request.users?.email ||
                          "User"}
                      </p>

                      <p className="mt-1 text-sm text-slate-400">
                        {request.users?.email || "No email"}
                      </p>

                      <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
                        <span>
                          Amount:{" "}
                          <strong>₹{request.amount}</strong>
                        </span>
                        <span>
                          UTR:{" "}
                          <strong className="break-all">
                            {request.utr}
                          </strong>
                        </span>
                        <span>
                          Status:{" "}
                          <strong>{request.status}</strong>
                        </span>
                      </div>

                      {request.note && (
                        <p className="mt-3 text-sm text-slate-400">
                          Note: {request.note}
                        </p>
                      )}

                      {request.rejection_reason && (
                        <p className="mt-3 text-sm text-red-300">
                          Reason: {request.rejection_reason}
                        </p>
                      )}
                    </div>

                    {request.status === "pending" && (
                      <div className="flex shrink-0 gap-3">
                        <button
                          type="button"
                          disabled={actionId === request.id}
                          onClick={() => approve(request.id)}
                          className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold hover:bg-emerald-500 disabled:opacity-50"
                        >
                          <Check size={17} />
                          Approve
                        </button>

                        <button
                          type="button"
                          disabled={actionId === request.id}
                          onClick={() => reject(request.id)}
                          className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold hover:bg-red-500 disabled:opacity-50"
                        >
                          <X size={17} />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
