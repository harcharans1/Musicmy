import { useState } from "react";
import {
  Copy,
  Download,
  Save,
  Sparkles,
} from "lucide-react";
import { useParams } from "react-router-dom";

import { aiApi } from "../services/api";
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

  const name =
    names[slug] || slug.replaceAll("-", " ");

  const [input, setInput] = useState("");
  const [out, setOut] = useState("");
  const [busy, setBusy] = useState(false);

  const go = async () => {
    if (!input.trim()) return;

    setBusy(true);
    setOut("");

    try {
      let response;

      /* =========================
         IMAGE GENERATOR
      ========================= */

      if (slug === "ai-image-generator") {
        response = await aiApi.image({
          prompt: input,
          slug,
          title: "AI Image Generation",
        });

        const result = response.data?.result;

        if (result?.url) {
          setOut(result.url);
        } else {
          setOut(JSON.stringify(result, null, 2));
        }

        return;
      }

      /* =========================
         SUMMARIZER
      ========================= */

      if (slug.includes("summarizer")) {
        response = await aiApi.summarize({
          text: input,
          slug,
          title: "AI Summary",
        });

        setOut(
          response.data?.result ||
            response.data?.output ||
            response.data?.text ||
            ""
        );

        return;
      }

      /* =========================
         TRANSLATOR
      ========================= */

      if (slug.includes("translator")) {
        response = await aiApi.translate({
          text: input,
          language: "English",
          slug,
          title: "AI Translation",
        });

        setOut(
          response.data?.result ||
            response.data?.output ||
            response.data?.text ||
            ""
        );

        return;
      }

      /* =========================
         NORMAL AI GENERATION
      ========================= */

      response = await aiApi.generate({
        prompt: input,
        type: "text",
        slug,
        title: name,
      });

      setOut(
        response.data?.result ||
          response.data?.output ||
          response.data?.text ||
          ""
      );
    } catch (error) {
      console.error("AI Tool Error:", error);

      setOut(
        error.response?.data?.message ||
          error.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setBusy(false);
    }
  };

  /* =========================
     COPY
  ========================= */

  const copyOutput = async () => {
    if (!out) return;

    try {
      await navigator.clipboard.writeText(out);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  /* =========================
     DOWNLOAD
  ========================= */

  const downloadOutput = () => {
    if (!out) return;

    const blob = new Blob([out], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${slug}-result.txt`;
    a.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-7xl py-8">
      {/* HEADER */}

      <p className="text-xs uppercase tracking-[.2em] text-violet-400">
        AI WORKSPACE
      </p>

      <h1 className="mt-2 text-3xl font-black capitalize">
        {name}
      </h1>

      <div className="mt-7 grid gap-5 lg:grid-cols-2">

        {/* =========================
            INPUT
        ========================= */}

        <section className="glass rounded-2xl p-5">
          <h2 className="font-semibold">
            Input
          </h2>

          <textarea
            className="mt-4 min-h-[330px] w-full resize-none rounded-xl border border-white/10 bg-black/20 p-4 text-sm outline-none"
            value={input}
            onChange={(e) =>
              setInput(e.target.value)
            }
            placeholder="Tell AI what you want to create..."
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
                Generate
                <Sparkles size={15} />
              </>
            )}
          </Button>
        </section>

        {/* =========================
            OUTPUT
        ========================= */}

        <section className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">
              Output
            </h2>

            <div className="flex gap-3">
              <button
                onClick={copyOutput}
                disabled={!out}
                title="Copy"
                className="transition hover:text-violet-400 disabled:opacity-30"
              >
                <Copy size={15} />
              </button>

              <button
                onClick={() =>
                  console.log(
                    "Save output:",
                    out
                  )
                }
                disabled={!out}
                title="Save"
                className="transition hover:text-violet-400 disabled:opacity-30"
              >
                <Save size={15} />
              </button>

              <button
                onClick={downloadOutput}
                disabled={!out}
                title="Download"
                className="transition hover:text-violet-400 disabled:opacity-30"
              >
                <Download size={15} />
              </button>
            </div>
          </div>

          {/* =========================
              SCROLLABLE OUTPUT BOX
          ========================= */}

          <div
            className="
              mt-4
              min-h-[330px]
              max-h-[500px]
              overflow-y-auto
              overflow-x-hidden
              whitespace-pre-wrap
              break-words
              rounded-xl
              border
              border-white/5
              bg-black/20
              p-5
              text-sm
              leading-7
              text-slate-300
              scrollbar-thin
              scrollbar-thumb-violet-500/40
              scrollbar-track-transparent
            "
          >
            {out ? (
              slug === "ai-image-generator" &&
              out.startsWith("http") ? (
                <img
                  src={out}
                  alt="Generated AI"
                  className="max-h-[450px] w-full rounded-xl object-contain"
                />
              ) : (
                out
              )
            ) : (
              <span className="text-slate-700">
                Your generated result will appear here.
              </span>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}