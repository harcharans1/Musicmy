import { useState } from "react";
import {
  Copy,
  Download,
  Heart,
  Save,
  Sparkles,
  Check,
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

const languages = [
  "English",
  "Punjabi",
  "Hindi",
  "Urdu",
  "French",
  "Spanish",
  "German",
  "Italian",
  "Portuguese",
  "Chinese",
  "Japanese",
];

export default function ToolWorkspace() {
  const { slug } = useParams();

  const name =
    names[slug] || slug?.replaceAll("-", " ") || "AI Tool";

  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [language, setLanguage] = useState("Punjabi");

  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const [error, setError] = useState("");
  const [generationId, setGenerationId] = useState(null);

  const isTranslator = slug === "ai-translator";
  const isImage = slug === "ai-image-generator";

  const generate = async () => {
    if (!input.trim()) {
      setError(
        isTranslator
          ? "Please enter some text to translate."
          : "Please enter a prompt."
      );
      return;
    }

    setBusy(true);
    setError("");
    setOutput("");
    setSaved(false);

    try {
      let response;

      if (isImage) {
        response = await aiApi.image({
          prompt: input.trim(),
          slug,
          title: name,
        });
      } else if (isTranslator) {
        response = await aiApi.translate({
          text: input.trim(),
          language,
          slug,
          title: name,
        });
      } else if (slug === "ai-summarizer") {
        response = await aiApi.summarize({
          text: input.trim(),
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

      const data = response?.data;

      const result = data?.result;

      setGenerationId(
        data?.generationId ||
          data?.generation?.id ||
          null
      );

      if (isImage && result?.url) {
        setOutput(result.url);
      } else {
        setOutput(
          typeof result === "string"
            ? result
            : JSON.stringify(result, null, 2)
        );
      }

      setSaved(true);
    } catch (err) {
      console.error("AI tool error:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setBusy(false);
    }
  };

  const copyOutput = async () => {
    if (!output) return;

    try {
      await navigator.clipboard.writeText(output);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const downloadOutput = () => {
    if (!output) return;

    if (isImage && output.startsWith("data:image")) {
      const link = document.createElement("a");

      link.href = output;
      link.download = `${slug || "aiforge"}-image.png`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      return;
    }

    const blob = new Blob([output], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = `${slug || "aiforge"}-output.txt`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  };

  const saveOutput = async () => {
    if (!output) return;

    try {
      await savedOutputApi.save({
        title: name,
        content: output,
      });

      setSaved(true);
    } catch (err) {
      console.error("Save output error:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to save this output."
      );
    }
  };

  const toggleFavorite = async () => {
    if (!generationId) {
      setError(
        "Generate something first before adding it to favorites."
      );
      return;
    }

    try {
      if (!favorite) {
        await userApi.addFavorite(generationId);
        setFavorite(true);
      }
    } catch (err) {
      console.error("Favorite error:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to update favorite."
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#08090d] text-white">
      <div className="mx-auto max-w-7xl px-5 py-10">
        {/* Header */}
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-sm font-medium uppercase tracking-[0.25em] text-violet-400">
              AI Workspace
            </p>

            <h1 className="text-4xl font-bold capitalize">
              {name}
            </h1>
          </div>

          {saved && output && (
            <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400">
              Generation saved
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-red-300">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* INPUT */}
          <div className="rounded-2xl border border-white/10 bg-[#101116] p-6 shadow-xl">
            <h2 className="mb-5 text-lg font-semibold">
              Input
            </h2>

            {/* Translator language */}
            {isTranslator && (
              <div className="mb-5">
                <label className="mb-2 block text-sm font-medium text-gray-300">
                  Translate to
                </label>

                <select
                  value={language}
                  onChange={(e) =>
                    setLanguage(e.target.value)
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#0b0c10] px-4 py-3 text-white outline-none transition focus:border-violet-500"
                >
                  {languages.map((item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <textarea
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setError("");
              }}
              placeholder={
                isTranslator
                  ? "Enter text you want to translate..."
                  : `Enter your ${name.toLowerCase()} request...`
              }
              className="min-h-[380px] w-full resize-none rounded-xl border border-white/10 bg-[#0b0c10] p-4 text-white outline-none placeholder:text-gray-600 focus:border-violet-500"
            />

            <div className="mt-5">
              <Button
                onClick={generate}
                disabled={busy}
                className="w-full"
              >
                {busy ? (
                  <>
                    <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles
                      size={18}
                      className="mr-2"
                    />
                    Generate
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* OUTPUT */}
          <div className="rounded-2xl border border-white/10 bg-[#101116] p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Output
              </h2>

              <div className="flex gap-2">
                <button
                  onClick={copyOutput}
                  disabled={!output || isImage}
                  title="Copy"
                  className="rounded-xl border border-white/10 bg-[#0b0c10] p-2.5 text-gray-300 transition hover:border-violet-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {copied ? (
                    <Check size={18} />
                  ) : (
                    <Copy size={18} />
                  )}
                </button>

                <button
                  onClick={saveOutput}
                  disabled={!output}
                  title="Save"
                  className="rounded-xl border border-white/10 bg-[#0b0c10] p-2.5 text-gray-300 transition hover:border-violet-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Save size={18} />
                </button>

                <button
                  onClick={toggleFavorite}
                  disabled={!generationId}
                  title="Favorite"
                  className={`rounded-xl border border-white/10 bg-[#0b0c10] p-2.5 transition hover:border-violet-500 disabled:cursor-not-allowed disabled:opacity-40 ${
                    favorite
                      ? "text-pink-400"
                      : "text-gray-300"
                  }`}
                >
                  <Heart
                    size={18}
                    fill={
                      favorite
                        ? "currentColor"
                        : "none"
                    }
                  />
                </button>

                <button
                  onClick={downloadOutput}
                  disabled={!output}
                  title="Download"
                  className="rounded-xl border border-white/10 bg-[#0b0c10] p-2.5 text-gray-300 transition hover:border-violet-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Download size={18} />
                </button>
              </div>
            </div>

            <div className="min-h-[380px] overflow-auto rounded-xl border border-white/10 bg-[#0b0c10] p-6">
              {!output && !busy && (
                <div className="flex min-h-[330px] items-center justify-center text-center text-gray-600">
                  Your generated result will appear here.
                </div>
              )}

              {busy && (
                <div className="flex min-h-[330px] items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-500" />

                    <p className="text-gray-400">
                      AI is generating your result...
                    </p>
                  </div>
                </div>
              )}

              {output && isImage && (
                <div className="flex justify-center">
                  <img
                    src={output}
                    alt="AI generated"
                    className="max-h-[600px] rounded-xl object-contain"
                  />
                </div>
              )}

              {output && !isImage && (
                <div className="whitespace-pre-wrap leading-8 text-gray-200">
                  {output}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}