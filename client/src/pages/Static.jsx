import { Link } from "react-router-dom";
import { useState } from "react";
import { Check, Lock, Sparkles, Zap } from "lucide-react";
import { paymentApi } from "../services/api";
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

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function Pricing() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isPro =
    user?.role === "admin" ||
    user?.plan === "pro" ||
    user?.plan === "premium";

  const startPro = async () => {
    setError("");

    if (!user) {
      window.location.href = "/login?redirect=/pricing";
      return;
    }

    if (isPro) return;

    try {
      setLoading(true);

      const response = await paymentApi.createSubscription();
      const data = response.data;

      if (!data?.success || !data?.subscriptionId || !data?.keyId) {
        throw new Error(data?.message || "Unable to create subscription.");
      }

      const loaded = await loadRazorpayScript();

      if (!loaded) {
        throw new Error("Razorpay checkout could not be loaded.");
      }

      const options = {
        key: data.keyId,
        subscription_id: data.subscriptionId,
        name: "AIForge",
        description: "AIForge Pro Monthly Subscription",
        image: "/logo.png",
        prefill: {
          name: user.name || "",
          email: user.email || "",
        },
        theme: {
          color: "#7c3aed",
        },
        handler: async (paymentResponse) => {
          try {
            await paymentApi.verifySubscription(paymentResponse);
            window.location.href = "/dashboard/subscription";
          } catch (err) {
            setError(
              err?.response?.data?.message ||
                "Payment verification failed. Please contact support."
            );
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      };

      const razorpay = new window.Razorpay(options);

      razorpay.on("payment.failed", (response) => {
        setError(
          response?.error?.description ||
            "Payment failed. Please try again."
        );
        setLoading(false);
      });

      razorpay.open();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to start payment."
      );
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white px-4 py-16">
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

        {error && (
          <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-center text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="mt-14 grid gap-8 lg:grid-cols-2">
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
              disabled={loading || isPro}
              className="mt-9 flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 font-semibold transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPro ? "✓ You are on Pro" : loading ? "Opening Checkout..." : "Upgrade to Pro"}
            </button>

            <p className="mt-4 text-center text-xs text-slate-500">
              Secure payment powered by Razorpay.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

export function Static() {
  return (
    <main className="min-h-screen bg-slate-950 text-white px-4 py-20">
      <div className="mx-auto max-w-5xl text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-400">
          AIForge
        </p>
        <h1 className="mt-5 text-5xl font-bold sm:text-7xl">
          AI tools built for everyday work.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
          Write, summarize, translate, code and create with a single AI
          workspace.
        </p>

        <div className="mt-10 flex justify-center gap-4">
          <Link
            to="/tools"
            className="rounded-2xl bg-violet-600 px-6 py-3 font-semibold hover:bg-violet-500"
          >
            Explore Tools
          </Link>
          <Link
            to="/pricing"
            className="rounded-2xl border border-white/10 px-6 py-3 font-semibold hover:bg-white/10"
          >
            View Pricing
          </Link>
        </div>
      </div>
    </main>
  );
}

export function Blog() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-16 text-white">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-4xl font-bold">AIForge Blog</h1>
        <p className="mt-3 text-slate-400">
          AI tips, productivity ideas and product updates.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            "How to use AI for productivity",
            "AI coding workflow for developers",
            "Writing better prompts",
          ].map((title) => (
            <article
              key={title}
              className="rounded-3xl border border-white/10 bg-white/[0.04] p-6"
            >
              <h2 className="text-xl font-semibold">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Practical AI ideas for students, creators and developers.
              </p>
              <Link
                to="/blog"
                className="mt-5 inline-block text-sm font-semibold text-violet-400"
              >
                Read more →
              </Link>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
