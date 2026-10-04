import { useState } from "react";
import { Link } from "react-router-dom";
import Logo from "../components/Logo";
import Button from "../components/Button";
import { api } from "../services/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await api.post("/auth/forgot-password", {
        email,
      });

      setSuccess(
        response.data?.message ||
          "If this email exists, a password reset link will be sent."
      );

      setEmail("");
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07080d] text-white">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-violet-600/20 blur-[120px]" />

        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-cyan-500/15 blur-[120px]" />

        <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-fuchsia-500/10 blur-[100px]" />
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-5 py-10">
        <div className="w-full max-w-md">

          {/* Logo */}
          <div className="mb-8 flex justify-center">
            <Link to="/">
              <Logo />
            </Link>
          </div>

          {/* Card */}
          <div className="rounded-[30px] border border-white/10 bg-white/[0.045] p-7 shadow-2xl shadow-black/40 backdrop-blur-2xl sm:p-9">

            {/* Icon */}
            <div className="mx-auto mb-7 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-400 text-2xl shadow-lg shadow-violet-500/20">
              🔐
            </div>

            {/* Heading */}
            <div className="text-center">
              <h1 className="text-3xl font-bold tracking-tight">
                Forgot your password?
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                Enter the email address linked to your AIForge account
                and we'll help you reset your password.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm leading-5 text-emerald-300">
                {success}
              </div>
            )}

            {/* Form */}
            <form
              onSubmit={submit}
              className="mt-7 space-y-5"
            >
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Email address
                </label>

                <input
                  className="field w-full"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <Button
                type="submit"
                className="w-full !rounded-2xl !py-3.5"
                variant="glow"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Sending request...
                  </span>
                ) : (
                  "Send reset link"
                )}
              </Button>
            </form>

            {/* Back to login */}
            <div className="mt-7 text-center">
              <Link
                to="/login"
                className="text-sm font-medium text-violet-300 transition hover:text-violet-200"
              >
                ← Back to sign in
              </Link>
            </div>

            {/* Divider */}
            <div className="my-7 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/10" />

              <span className="text-[10px] uppercase tracking-[0.2em] text-slate-600">
                AIForge
              </span>

              <div className="h-px flex-1 bg-white/10" />
            </div>

            <p className="text-center text-xs leading-5 text-slate-600">
              If you don't receive an email, check your spam folder.
            </p>
          </div>

          <p className="mt-6 text-center text-xs text-slate-600">
            Secure account recovery · AIForge
          </p>
        </div>
      </div>
    </main>
  );
}