import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/Logo";
import Button from "../components/Button";

export default function Auth({ register = false }) {
    const nav = useNavigate();
    const { login, register: reg } = useAuth();

    const [f, setF] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const [err, setErr] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const updateField = (field, value) => {
        setF((current) => ({
            ...current,
            [field]: value,
        }));
    };

    const go = async (e) => {
        e.preventDefault();
        setErr("");
        setLoading(true);

        try {
            if (register) {
                if (f.password !== f.confirmPassword) {
                    throw new Error("Passwords do not match");
                }

                await reg(f);
            } else {
                await login(f);
            }

            nav("/dashboard");
        } catch (x) {
            setErr(
                x?.response?.data?.message ||
                x?.message ||
                "Something went wrong. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#07080d] text-white">
            {/* Background Glow */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-violet-600/20 blur-[120px]" />

                <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-cyan-500/15 blur-[120px]" />

                <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-fuchsia-500/10 blur-[100px]" />
            </div>

            {/* Main */}
            <div className="relative mx-auto flex min-h-screen max-w-7xl items-center px-5 py-10">
                <div className="grid w-full items-center gap-12 lg:grid-cols-2">

                    {/* LEFT SIDE */}
                    <div className="hidden lg:block">
                        <Link to="/" className="inline-block">
                            <Logo />
                        </Link>

                        <div className="mt-16 max-w-xl">
                            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-300 backdrop-blur-xl">
                                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.9)]" />
                                AI-powered workspace
                            </div>

                            <h1 className="text-5xl font-black leading-tight tracking-tight xl:text-6xl">
                                Build faster.
                                <br />

                                <span className="bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 bg-clip-text text-transparent">
                                    Create smarter.
                                </span>
                            </h1>

                            <p className="mt-6 max-w-lg text-lg leading-8 text-slate-400">
                                {register
                                    ? "Create your AIForge account and unlock a powerful workspace for writing, translation, summarization and more."
                                    : "Welcome back to AIForge. Continue creating with powerful AI tools from one beautiful workspace."}
                            </p>

                            {/* Features */}
                            <div className="mt-10 grid max-w-xl grid-cols-3 gap-4">
                                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl">
                                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-xl">
                                        ✦
                                    </div>

                                    <p className="font-semibold">AI Writer</p>

                                    <p className="mt-1 text-xs text-slate-500">
                                        Create content
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl">
                                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-xl">
                                        ◈
                                    </div>

                                    <p className="font-semibold">Translator</p>

                                    <p className="mt-1 text-xs text-slate-500">
                                        Translate instantly
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl">
                                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-fuchsia-500/10 text-xl">
                                        ✧
                                    </div>

                                    <p className="font-semibold">Summarizer</p>

                                    <p className="mt-1 text-xs text-slate-500">
                                        Simplify content
                                    </p>
                                </div>
                            </div>
                        </div>

                        <p className="mt-16 text-xs text-slate-600">
                            © {new Date().getFullYear()} AIForge
                        </p>
                    </div>

                    {/* RIGHT SIDE */}
                    <div className="flex justify-center">
                        <div className="w-full max-w-md">

                            {/* Mobile Logo */}
                            <div className="mb-8 lg:hidden">
                                <Link to="/" className="inline-block">
                                    <Logo />
                                </Link>
                            </div>

                            {/* Auth Card */}
                            <div className="rounded-[28px] border border-white/10 bg-white/[0.045] p-7 shadow-2xl shadow-black/40 backdrop-blur-2xl sm:p-9">

                                {/* Icon */}
                                <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-400 text-2xl shadow-lg shadow-violet-500/20">
                                    ✦
                                </div>

                                {/* Heading */}
                                <h2 className="text-3xl font-bold tracking-tight">
                                    {register
                                        ? "Create your account"
                                        : "Welcome back"}
                                </h2>

                                <p className="mt-2 text-sm leading-6 text-slate-400">
                                    {register
                                        ? "Join AIForge and start creating with AI."
                                        : "Sign in to continue to your AIForge workspace."}
                                </p>

                                {/* Error */}
                                {err && (
                                    <div className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                                        {err}
                                    </div>
                                )}

                                {/* Form */}
                                <form
                                    onSubmit={go}
                                    className="mt-7 space-y-5"
                                >
                                    {/* Name */}
                                    {register && (
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-slate-300">
                                                Full name
                                            </label>

                                            <input
                                                className="field w-full"
                                                placeholder="Enter your full name"
                                                autoComplete="name"
                                                required
                                                value={f.name}
                                                onChange={(e) =>
                                                    updateField("name", e.target.value)
                                                }
                                            />
                                        </div>
                                    )}

                                    {/* Email */}
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
                                            value={f.email}
                                            onChange={(e) =>
                                                updateField("email", e.target.value)
                                            }
                                        />
                                    </div>

                                    {/* Password */}
                                    <div>
                                        <div className="mb-2 flex items-center justify-between">
                                            <label className="text-sm font-medium text-slate-300">
                                                Password
                                            </label>

                                            {!register && (
                                                <span className="text-xs text-slate-600">
                                                    Secure login
                                                </span>
                                            )}
                                        </div>

                                        <div className="relative">
                                            <input
                                                className="field w-full pr-12"
                                                type={
                                                    showPassword
                                                        ? "text"
                                                        : "password"
                                                }
                                                placeholder="Enter your password"
                                                autoComplete={
                                                    register
                                                        ? "new-password"
                                                        : "current-password"
                                                }
                                                required
                                                value={f.password}
                                                onChange={(e) =>
                                                    updateField(
                                                        "password",
                                                        e.target.value
                                                    )
                                                }
                                            />

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setShowPassword(
                                                        (value) => !value
                                                    )
                                                }
                                                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 transition hover:bg-white/5 hover:text-white"
                                            >
                                                {showPassword ? "🙈" : "👁"}
                                            </button>
                                        </div>
                                    </div>
                                    {/* Forgot Password */}
                                    {!register && (
                                        <div className="mt-2 flex justify-end">
                                            <Link
                                                to="/forgot-password"
                                                className="text-sm font-medium text-violet-300 transition hover:text-violet-200"
                                            >
                                                Forgot password?
                                            </Link>
                                        </div>
                                    )}

                                    {/* Confirm Password */}
                                    {register && (
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-slate-300">
                                                Confirm password
                                            </label>

                                            <input
                                                className="field w-full"
                                                type={
                                                    showPassword
                                                        ? "text"
                                                        : "password"
                                                }
                                                placeholder="Confirm your password"
                                                autoComplete="new-password"
                                                required
                                                value={f.confirmPassword}
                                                onChange={(e) =>
                                                    updateField(
                                                        "confirmPassword",
                                                        e.target.value
                                                    )
                                                }
                                            />
                                        </div>
                                    )}

                                    {/* Button */}
                                    <Button
                                        type="submit"
                                        className="mt-2 w-full !rounded-2xl !py-3.5"
                                        variant="glow"
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                                                {register
                                                    ? "Creating account..."
                                                    : "Signing in..."}
                                            </span>
                                        ) : register ? (
                                            "Create account"
                                        ) : (
                                            "Sign in"
                                        )}
                                    </Button>
                                </form>

                                {/* Divider */}
                                <div className="my-7 flex items-center gap-3">
                                    <div className="h-px flex-1 bg-white/10" />

                                    <span className="text-[10px] uppercase tracking-[0.2em] text-slate-600">
                                        AIForge
                                    </span>

                                    <div className="h-px flex-1 bg-white/10" />
                                </div>

                                {/* Switch */}
                                <p className="text-center text-sm text-slate-500">
                                    {register
                                        ? "Already have an account? "
                                        : "New to AIForge? "}

                                    <Link
                                        className="font-medium text-violet-300 transition hover:text-violet-200"
                                        to={
                                            register
                                                ? "/login"
                                                : "/register"
                                        }
                                    >
                                        {register
                                            ? "Sign in"
                                            : "Create an account"}
                                    </Link>
                                </p>
                            </div>

                            <p className="mt-6 text-center text-xs text-slate-600">
                                Secure authentication · AIForge
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}