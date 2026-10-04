import { useMemo, useState } from "react";
import {
  Check,
  Copy,
  Download,
  Heart,
  Save,
  Sparkles,
} from "lucide-react";
import { useParams } from "react-router-dom";
import { aiApi, savedOutputApi, userApi } from "../services/api";
import Button from "../components/Button";

const names = {
  "ai-writer": "AI Writer",
  "ai-image-generator": "AI Image Generator",
  "ai-summarizer": "AI Summarizer",
  "ai-translator": "AI Translator",
  "pdf-summarizer": "PDF Summarizer",
  "resume-builder": "AI Resume Builder",
};

export default function ToolWorkspace() {
  const { slug } = useParams();
  const name = names[slug] || slug.replaceAll("-", " ");

  const [input, setInput] = useState("");
  const [out, setOut] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [generationId, setGenerationId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const isImage = slug === "ai-image-generator";
  const isSummarizer = slug?.includes("summarizer");
  const isTranslator = slug?.includes("translator");

  const placeholder = useMemo(() => {
    if (isImage) return "Describe the image you want to create...";
    if (isSummarizer) return "Paste the text you want to summarize...";
    if (isTranslator) return "Enter the text you want to translate...";
    return "Tell AI exactly what you want to create...";
  }, [isImage, isSummarizer, isTranslator]);

  const go = async () => {
    if (!input.trim()) return;

    setBusy(true);
    setError("");
    setOut("");
    setImageUrl("");
    setGenerationId(null);
    setSaved(false);
    setFavorite(false);

    try {
      let response;

      if (isImage) {
        response = await aiApi.image({
          prompt: input.trim(),
          slug,
          title: name,
        });
      } else if (isSummarizer) {
        response = await aiApi.summarize({
          text: input.trim(),
          slug,
          title: name,
        });
      } else if (isTranslator) {
        response = await aiApi.translate({
          text: input.trim(),
          language: "English",
          slug,
          title: name,
        });
      } else {
        response = await aiApi.generate({
          prompt: input.trim(),
          type: "text",
          slug,
          title: name,
        });
      }

      const data = response.data || {};
      const result = data.result;

      setGenerationId(data.generationId || data.generation?.id || null);

      if (isImage) {
        const url =
          typeof result === "string"
            ? result
            : result?.url || "";

        setImageUrl(url);
        setOut(result?.message || "");
      } else {
        setOut(
          typeof result === "string"
            ? result
            : result?.text || result?.content || ""
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "AI generation failed. Please try again."
      );
    } finally {
      setBusy(false);
    }
  };

  const copyOutput = async () => {
    const value = isImage ? imageUrl : out;
    if (!value) return;

    await navigator.clipboard?.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const downloadOutput = () => {
    if (isImage && imageUrl) {
      const a = document.createElement("a");
      a.href = imageUrl;
      a.download = "aiforge-generated-image.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      return;
    }

    if (!out) return;

    const blob = new Blob([out], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug || "aiforge-output"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const saveOutput = async () => {
    const content = isImage ? imageUrl : out;
    if (!content) return;

    try {
      await savedOutputApi.save({
        title: name,
        content,
      });
      setSaved(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not save this output."
      );
    }
  };

  const toggleFavorite = async () => {
    if (!generationId) {
      setError("Generate a result first.");
      return;
    }

    try {
      if (favorite) {
        setError("Remove this favorite from History or Favorites.");
        return;
      }

      await userApi.addFavorite(generationId);
      setFavorite(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not add this generation to favorites."
      );
    }
  };

  return (
    <div className="mx-auto max-w-7xl py-8">
      <p className="text-xs uppercase tracking-[.2em] text-violet-400">
        AI WORKSPACE
      </p>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-black capitalize">{name}</h1>

        {generationId && (
          <span className="rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1 text-xs text-emerald-300">
            Generation saved
          </span>
        )}
      </div>

      {error && (
        <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="mt-7 grid gap-5 lg:grid-cols-2">
        <section className="glass rounded-2xl p-5">
          <h2 className="font-semibold">Input</h2>

          <textarea
            className="mt-4 min-h-[330px] w-full resize-none rounded-xl border border-white/10 bg-black/20 p-4 text-sm outline-none focus:border-violet-500/40"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
          />

          <Button
            variant="glow"
            className="mt-3 w-full"
            onClick={go}
            disabled={busy || !input.trim()}
          >
            {busy ? (
              "Generating..."
            ) : (
              <>
                Generate <Sparkles size={15} />
              </>
            )}
          </Button>
        </section>

        <section className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold">Output</h2>

            <div className="flex gap-2">
              <button
                onClick={copyOutput}
                disabled={isImage ? !imageUrl : !out}
                className="rounded-lg border border-white/10 p-2 hover:bg-white/5 disabled:opacity-30"
                title="Copy"
              >
                {copied ? <Check size={15} /> : <Copy size={15} />}
              </button>

              <button
                onClick={saveOutput}
                disabled={isImage ? !imageUrl : !out}
                className="rounded-lg border border-white/10 p-2 hover:bg-white/5 disabled:opacity-30"
                title="Save"
              >
                <Save size={15} />
              </button>

              <button
                onClick={toggleFavorite}
                disabled={!generationId}
                className={`rounded-lg border p-2 disabled:opacity-30 ${
                  favorite
                    ? "border-pink-500/30 bg-pink-500/10 text-pink-300"
                    : "border-white/10 hover:bg-white/5"
                }`}
                title="Favorite"
              >
                <Heart size={15} fill={favorite ? "currentColor" : "none"} />
              </button>

              <button
                onClick={downloadOutput}
                disabled={isImage ? !imageUrl : !out}
                className="rounded-lg border border-white/10 p-2 hover:bg-white/5 disabled:opacity-30"
                title="Download"
              >
                <Download size={15} />
              </button>
            </div>
          </div>

          <div className="mt-4 min-h-[330px] rounded-xl border border-white/5 bg-black/20 p-5 text-sm leading-7 text-slate-300">
            {isImage && imageUrl ? (
              <div className="flex min-h-[290px] items-center justify-center">
                <img
                  src={imageUrl}
                  alt={input}
                  className="max-h-[520px] max-w-full rounded-xl object-contain"
                />
              </div>
            ) : out ? (
              <div className="whitespace-pre-wrap">{out}</div>
            ) : (
              <div className="grid min-h-[290px] place-items-center text-center text-slate-700">
                Your generated result will appear here.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
