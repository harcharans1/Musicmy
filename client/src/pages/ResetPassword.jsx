import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Logo from "../components/Logo";
import Button from "../components/Button";
import { authApi } from "../services/api";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!token) {
      setError("Invalid or missing reset token.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await authApi.resetPassword({
        token,
        password,
      });

      setSuccess(
        response.data?.message ||
          "Password reset successfully."
      );

      setPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        navigate("/login");
      }, 1800);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Unable to reset password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#07080d] text-white">

      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-violet-600/20 blur-[120px]" />

        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-cyan-500/15 blur-[120px]" />
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-5 py-10">

        <div className="w-full max-w-md">

          <div className="mb-8 flex justify-center">
            <Link to="/">
              <Logo />
            </Link>
          </div>

          <div className="rounded-[30px] border border-white/10 bg-white/[0.045] p-7 shadow-2xl shadow-black/40 backdrop-blur-2xl sm:p-9">

            <div className="mx-auto mb-7 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-400 text-2xl shadow-lg shadow-violet-500/20">
              🔑
            </div>

            <div className="text-center">
              <h1 className="text-3xl font-bold tracking-tight">
                Create new password
              </h1>

              <p className="mt-3 text-sm leading-6 text-slate-400">
                Choose a strong new password for your AIForge account.
              </p>
            </div>

            {error && (
              <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {success && (
              <div className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                {success}
              </div>
            )}

            <form onSubmit={submit} className="mt-7 space-y-5">

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  New password
                </label>

                <input
                  className="field w-full"
                  type="password"
                  placeholder="Enter new password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Confirm password
                </label>

                <input
                  className="field w-full"
                  type="password"
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
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
                    Updating password...
                  </span>
                ) : (
                  "Reset Password"
                )}
              </Button>

            </form>

            <div className="mt-7 text-center">
              <Link
                to="/login"
                className="text-sm font-medium text-violet-300 transition hover:text-violet-200"
              >
                ← Back to sign in
              </Link>
            </div>

          </div>

          <p className="mt-6 text-center text-xs text-slate-600">
            Secure account recovery · AIForge
          </p>

        </div>
      </div>
    </main>
  );
}