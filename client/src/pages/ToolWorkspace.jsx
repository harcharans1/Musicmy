import { useEffect, useMemo, useState } from "react";

import {

  Copy,

  Download,

  Heart,

  Save,

  Sparkles,

  Check,

  Code2,

  FileText,

  Mail,

  PenLine,

  Languages,

  Briefcase,

  MessageSquare,

} from "lucide-react";

import { useParams } from "react-router-dom";



import { aiApi, savedOutputApi, userApi } from "../services/api";

import Button from "../components/Button";



const names = {

  "ai-writer": "AI Writer",

  "ai-paraphraser": "AI Paraphraser",

  "ai-summarizer": "AI Summarizer",

  "ai-translator": "AI Translator",

  "ai-image-generator": "AI Image Generator",

  "ai-image-enhancer": "AI Image Enhancer",

  "code-generator": "Code Generator",

  "code-explainer": "Code Explainer",

  "pdf-summarizer": "PDF Summarizer",

  "caption-generator": "Caption Generator",

  "resume-builder": "AI Resume Builder",

  "email-writer": "Email Writer",

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



const tones = [

  "Professional",

  "Friendly",

  "Casual",

  "Formal",

  "Creative",

  "Persuasive",

  "Simple",

];



const lengths = [

  "Short",

  "Medium",

  "Long",

];



const platforms = [

  "Instagram",

  "Facebook",

  "LinkedIn",

  "YouTube",

  "X / Twitter",

];



const codeLanguages = [

  "JavaScript",

  "TypeScript",

  "Python",

  "Java",

  "C",

  "C++",

  "C#",

  "PHP",

  "Dart",

  "Go",

  "Rust",

  "HTML/CSS",

  "SQL",

];



const experienceLevels = [

  "Fresher",

  "0-2 years",

  "2-5 years",

  "5+ years",

];



export default function ToolWorkspace() {

  const { slug } = useParams();



  const name =

    names[slug] ||

    slug?.replaceAll("-", " ") ||

    "AI Tool";



  const [input, setInput] = useState("");

  const [output, setOutput] = useState("");



  const [language, setLanguage] = useState("Punjabi");

  const [tone, setTone] = useState("Professional");

  const [length, setLength] = useState("Medium");

  const [platform, setPlatform] = useState("Instagram");

  const [codeLanguage, setCodeLanguage] = useState("JavaScript");

  const [experience, setExperience] = useState("Fresher");

  const [jobRole, setJobRole] = useState("");



  const [busy, setBusy] = useState(false);

  const [saved, setSaved] = useState(false);

  const [copied, setCopied] = useState(false);

  const [favorite, setFavorite] = useState(false);

  const [error, setError] = useState("");

  const [generationId, setGenerationId] = useState(null);
  const [credits, setCredits] = useState(null);
  const [generationCount, setGenerationCount] = useState(0);



  const isTranslator = slug === "ai-translator";

  const isSummarizer = slug === "ai-summarizer";

  const isImage = slug === "ai-image-generator";

  const isParaphraser = slug === "ai-paraphraser";

  const isCodeGenerator = slug === "code-generator";

  const isCodeExplainer = slug === "code-explainer";

  const isEmailWriter = slug === "email-writer";

  const isCaptionGenerator = slug === "caption-generator";

  const isResumeBuilder = slug === "resume-builder";

  const inputStats = useMemo(() => {
    const words = input.trim() ? input.trim().split(/\s+/).length : 0;

    return {
      words,
      characters: input.length,
    };
  }, [input]);

  const outputStats = useMemo(() => {
    const words = output.trim() ? output.trim().split(/\s+/).length : 0;

    return {
      words,
      characters: output.length,
    };
  }, [output]);

  useEffect(() => {
    let mounted = true;

    userApi
      .usage()
      .then((response) => {
        if (!mounted) return;

        const data = response?.data || {};

        setCredits(
          data?.creditsRemaining ??
            data?.remainingCredits ??
            data?.credits ??
            null
        );
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, [generationCount]);



  const getPlaceholder = () => {

    if (isTranslator) {

      return "Enter the text you want to translate...";

    }



    if (isSummarizer) {

      return "Paste the text you want AIForge to summarize...";

    }



    if (isParaphraser) {

      return "Paste the text you want to rewrite...";

    }



    if (isCodeGenerator) {

      return "Describe the code you want to generate...\n\nExample: Create a JavaScript calculator with add, subtract, multiply and divide functions.";

    }



    if (isCodeExplainer) {

      return "Paste your code here and AIForge will explain it...";

    }



    if (isEmailWriter) {

      return "Describe what the email should be about...\n\nExample: Write an email requesting 2 days leave from my manager.";

    }



    if (isCaptionGenerator) {

      return "Describe your post, photo or video...\n\nExample: A travel photo from Manali during snowfall.";

    }



    if (isResumeBuilder) {

      return "Enter your education, skills, projects and other details...\n\nExample: MCA student, JavaScript, React, Node.js, e-commerce project.";

    }



    if (isImage) {

      return "Describe the image you want to create...";

    }



    return `Tell AIForge what you want to create...`;

  };



  const generate = async () => {

    if (!input.trim()) {

      setError(

        isTranslator

          ? "Please enter some text to translate."

          : "Please enter your request."

      );

      return;

    }



    if (isResumeBuilder && !jobRole.trim()) {

      setError("Please enter the job role you are applying for.");

      return;

    }



    setBusy(true);

    setError("");

    setOutput("");

    setSaved(false);

    setCopied(false);



    try {

      let response;



      /*

       * IMAGE

       */

      if (isImage) {

        response = await aiApi.image({

          prompt: input.trim(),

          slug,

          title: name,

        });

      }



      /*

       * TRANSLATOR

       */

      else if (isTranslator) {

        response = await aiApi.translate({

          text: input.trim(),

          language,

          slug,

          title: name,

        });

      }



      /*

       * SUMMARIZER

       */

      else if (isSummarizer) {

        response = await aiApi.summarize({

          text: input.trim(),

          slug,

          title: name,

        });

      }



      /*

       * OTHER TOOLS

       */

      else {

        let prompt = input.trim();



        if (isParaphraser) {

          prompt = `

Rewrite the following text.



Style: ${tone}

Length: ${length}



Text:

${input.trim()}

          `.trim();

        }



        if (isCodeGenerator) {

          prompt = `

Generate code for the following request.



Programming language:

${codeLanguage}



Request:

${input.trim()}



Return clean, runnable code.

          `.trim();

        }



        if (isCodeExplainer) {

          prompt = `

Explain the following ${codeLanguage} code in a beginner-friendly way.



Code:

${input.trim()}

          `.trim();

        }



        if (isEmailWriter) {

          prompt = `

Write a professional email based on the following request.



Tone:

${tone}



Length:

${length}



Request:

${input.trim()}



Include a useful subject line and the email body.

          `.trim();

        }



        if (isCaptionGenerator) {

          prompt = `

Create social media captions for the following content.



Platform:

${platform}



Tone:

${tone}



Number of captions:

3



Content:

${input.trim()}



Include hashtags when useful.

          `.trim();

        }



        if (isResumeBuilder) {

          prompt = `

Create ATS-friendly resume content.



Target job role:

${jobRole}



Experience level:

${experience}



Tone:

Professional



Candidate information:

${input.trim()}



Do not invent experience, employers, education, dates or achievements.

Use placeholders when information is missing.

          `.trim();

        }



        if (!isParaphraser &&

            !isCodeGenerator &&

            !isCodeExplainer &&

            !isEmailWriter &&

            !isCaptionGenerator &&

            !isResumeBuilder) {

          prompt = `

Create high-quality content for this request.



Tone:

${tone}



Length:

${length}



Request:

${input.trim()}

          `.trim();

        }



        response = await aiApi.generate({

          prompt,

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



      setSaved(false);

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



  const regenerate = async () => {
    if (!input.trim() || busy) return;

    await generate();
  };

  const clearWorkspace = () => {
    setInput("");
    setOutput("");
    setError("");
    setSaved(false);
    setCopied(false);
    setFavorite(false);
    setGenerationId(null);
  };

  const copyOutput = async () => {

    if (!output || isImage) return;



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



    if (

      isImage &&

      output.startsWith("data:image")

    ) {

      const link = document.createElement("a");



      link.href = output;

      link.download = `${slug || "aiforge"}-image.png`;



      document.body.appendChild(link);

      link.click();

      link.remove();



      return;

    }



    const blob = new Blob(

      [output],

      {

        type: "text/plain;charset=utf-8",

      }

    );



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

      setError("");

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



  const renderToolOptions = () => {

    if (

      !isTranslator &&

      !isParaphraser &&

      !isCodeGenerator &&

      !isCodeExplainer &&

      !isEmailWriter &&

      !isCaptionGenerator &&

      !isResumeBuilder &&

      !isImage

    ) {

      return (

        <div className="grid gap-4 sm:grid-cols-2">

          <div>

            <label className="mb-2 block text-sm font-medium text-gray-300">

              Tone

            </label>



            <select

              value={tone}

              onChange={(e) => setTone(e.target.value)}

              className="w-full rounded-xl border border-white/10 bg-[#0b0c10] px-4 py-3 text-white outline-none transition focus:border-violet-500"

            >

              {tones.map((item) => (

                <option key={item} value={item}>

                  {item}

                </option>

              ))}

            </select>

          </div>



          <div>

            <label className="mb-2 block text-sm font-medium text-gray-300">

              Length

            </label>



            <select

              value={length}

              onChange={(e) => setLength(e.target.value)}

              className="w-full rounded-xl border border-white/10 bg-[#0b0c10] px-4 py-3 text-white outline-none transition focus:border-violet-500"

            >

              {lengths.map((item) => (

                <option key={item} value={item}>

                  {item}

                </option>

              ))}

            </select>

          </div>

        </div>

      );

    }



    if (isTranslator) {

      return (

        <div>

          <label className="mb-2 block text-sm font-medium text-gray-300">

            Translate to

          </label>



          <select

            value={language}

            onChange={(e) => setLanguage(e.target.value)}

            className="w-full rounded-xl border border-white/10 bg-[#0b0c10] px-4 py-3 text-white outline-none transition focus:border-violet-500"

          >

            {languages.map((item) => (

              <option key={item} value={item}>

                {item}

              </option>

            ))}

          </select>

        </div>

      );

    }



    if (isParaphraser) {

      return (

        <div className="grid gap-4 sm:grid-cols-2">

          <div>

            <label className="mb-2 block text-sm font-medium text-gray-300">

              Writing Style

            </label>



            <select

              value={tone}

              onChange={(e) => setTone(e.target.value)}

              className="w-full rounded-xl border border-white/10 bg-[#0b0c10] px-4 py-3 text-white outline-none focus:border-violet-500"

            >

              {tones.map((item) => (

                <option key={item} value={item}>

                  {item}

                </option>

              ))}

            </select>

          </div>



          <div>

            <label className="mb-2 block text-sm font-medium text-gray-300">

              Length

            </label>



            <select

              value={length}

              onChange={(e) => setLength(e.target.value)}

              className="w-full rounded-xl border border-white/10 bg-[#0b0c10] px-4 py-3 text-white outline-none focus:border-violet-500"

            >

              {lengths.map((item) => (

                <option key={item} value={item}>

                  {item}

                </option>

              ))}

            </select>

          </div>

        </div>

      );

    }



    if (isCodeGenerator || isCodeExplainer) {

      return (

        <div>

          <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-300">

            <Code2 size={16} />

            Programming Language

          </label>



          <select

            value={codeLanguage}

            onChange={(e) =>

              setCodeLanguage(e.target.value)

            }

            className="w-full rounded-xl border border-white/10 bg-[#0b0c10] px-4 py-3 text-white outline-none focus:border-violet-500"

          >

            {codeLanguages.map((item) => (

              <option key={item} value={item}>

                {item}

              </option>

            ))}

          </select>

        </div>

      );

    }



    if (isEmailWriter) {

      return (

        <div className="grid gap-4 sm:grid-cols-2">

          <div>

            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-300">

              <Mail size={16} />

              Tone

            </label>



            <select

              value={tone}

              onChange={(e) => setTone(e.target.value)}

              className="w-full rounded-xl border border-white/10 bg-[#0b0c10] px-4 py-3 text-white outline-none focus:border-violet-500"

            >

              {tones.map((item) => (

                <option key={item} value={item}>

                  {item}

                </option>

              ))}

            </select>

          </div>



          <div>

            <label className="mb-2 block text-sm font-medium text-gray-300">

              Length

            </label>



            <select

              value={length}

              onChange={(e) => setLength(e.target.value)}

              className="w-full rounded-xl border border-white/10 bg-[#0b0c10] px-4 py-3 text-white outline-none focus:border-violet-500"

            >

              {lengths.map((item) => (

                <option key={item} value={item}>

                  {item}

                </option>

              ))}

            </select>

          </div>

        </div>

      );

    }



    if (isCaptionGenerator) {

      return (

        <div className="grid gap-4 sm:grid-cols-2">

          <div>

            <label className="mb-2 block text-sm font-medium text-gray-300">

              Platform

            </label>



            <select

              value={platform}

              onChange={(e) => setPlatform(e.target.value)}

              className="w-full rounded-xl border border-white/10 bg-[#0b0c10] px-4 py-3 text-white outline-none focus:border-violet-500"

            >

              {platforms.map((item) => (

                <option key={item} value={item}>

                  {item}

                </option>

              ))}

            </select>

          </div>



          <div>

            <label className="mb-2 block text-sm font-medium text-gray-300">

              Tone

            </label>



            <select

              value={tone}

              onChange={(e) => setTone(e.target.value)}

              className="w-full rounded-xl border border-white/10 bg-[#0b0c10] px-4 py-3 text-white outline-none focus:border-violet-500"

            >

              {tones.map((item) => (

                <option key={item} value={item}>

                  {item}

                </option>

              ))}

            </select>

          </div>

        </div>

      );

    }



    if (isResumeBuilder) {

      return (

        <div className="space-y-4">

          <div>

            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-300">

              <Briefcase size={16} />

              Target Job Role

            </label>



            <input

              value={jobRole}

              onChange={(e) => setJobRole(e.target.value)}

              placeholder="e.g. Frontend Developer"

              className="w-full rounded-xl border border-white/10 bg-[#0b0c10] px-4 py-3 text-white outline-none placeholder:text-gray-600 focus:border-violet-500"

            />

          </div>



          <div>

            <label className="mb-2 block text-sm font-medium text-gray-300">

              Experience

            </label>



            <select

              value={experience}

              onChange={(e) =>

                setExperience(e.target.value)

              }

              className="w-full rounded-xl border border-white/10 bg-[#0b0c10] px-4 py-3 text-white outline-none focus:border-violet-500"

            >

              {experienceLevels.map((item) => (

                <option key={item} value={item}>

                  {item}

                </option>

              ))}

            </select>

          </div>

        </div>

      );

    }



    return null;

  };



  return (

    <div className="min-h-screen bg-[#08090d] text-white">

      <div className="mx-auto max-w-7xl px-5 py-10">



        {/* HEADER */}

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

          <div>

            <div className="mb-3 flex items-center gap-2">

              <div className="rounded-lg bg-violet-500/10 p-2 text-violet-400">

                <Sparkles size={18} />

              </div>



              <p className="text-sm font-medium uppercase tracking-[0.25em] text-violet-400">

                AI Workspace

              </p>

            </div>



            <h1 className="text-3xl font-bold capitalize sm:text-4xl">

              {name}

            </h1>



            <p className="mt-2 max-w-2xl text-sm text-gray-500">

              Create professional AI-powered content with AIForge.

            </p>

          </div>



          {saved && output && (

            <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400">

              ✓ Output saved

            </div>

          )}

        </div>



        {/* ERROR */}

        {error && (

          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-300">

            {error}

          </div>

        )}



        <div className="grid gap-6 lg:grid-cols-2">



          {/* INPUT */}

          <div className="rounded-2xl border border-white/10 bg-[#101116] p-6 shadow-xl">



            <div className="mb-6 flex items-center gap-3">

              <div className="rounded-xl bg-violet-500/10 p-2.5 text-violet-400">

                {isCodeGenerator || isCodeExplainer ? (

                  <Code2 size={20} />

                ) : isEmailWriter ? (

                  <Mail size={20} />

                ) : isResumeBuilder ? (

                  <Briefcase size={20} />

                ) : isTranslator ? (

                  <Languages size={20} />

                ) : isParaphraser ? (

                  <PenLine size={20} />

                ) : (

                  <MessageSquare size={20} />

                )}

              </div>



              <div>

                <h2 className="text-lg font-semibold">

                  Input

                </h2>



                <p className="text-xs text-gray-500">

                  Configure your request

                </p>

              </div>

            </div>



            {/* TOOL OPTIONS */}

            <div className="mb-5">

              {renderToolOptions()}

            </div>



            {/* MAIN INPUT */}

            <textarea

              value={input}

              onChange={(e) => {

                setInput(e.target.value);

                setError("");

              }}

              placeholder={getPlaceholder()}

              className="min-h-[330px] w-full resize-none rounded-xl border border-white/10 bg-[#0b0c10] p-4 text-sm leading-7 text-white outline-none placeholder:text-gray-600 transition focus:border-violet-500"

            />

            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {inputStats.words} words · {inputStats.characters} characters
              </p>

              {input && (
                <button
                  type="button"
                  onClick={clearWorkspace}
                  disabled={busy}
                  className="text-xs font-medium text-gray-500 transition hover:text-white disabled:opacity-40"
                >
                  Clear
                </button>
              )}
            </div>

            {/* GENERATE */}

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

                    Generate with AI

                  </>

                )}

              </Button>

            </div>

          </div>



          {/* OUTPUT */}

          <div className="rounded-2xl border border-white/10 bg-[#101116] p-6 shadow-xl">



            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <h2 className="text-lg font-semibold">

                  Output

                </h2>



                <p className="text-xs text-gray-500">

                  Your AI-generated result

                </p>

              </div>



              <div className="flex flex-wrap items-center justify-end gap-2">
                {credits !== null && (
                  <div className="mr-1 rounded-xl border border-violet-500/20 bg-violet-500/10 px-3 py-2 text-xs font-medium text-violet-300">
                    {credits} credits
                  </div>
                )}

                {output && !isImage && (
                  <div className="mr-1 hidden text-xs text-gray-500 sm:block">
                    {outputStats.words} words
                  </div>
                )}

                <button
                  onClick={regenerate}
                  disabled={!input.trim() || busy}
                  title="Regenerate"
                  className="rounded-xl border border-white/10 bg-[#0b0c10] px-3 py-2.5 text-xs font-medium text-gray-300 transition hover:border-violet-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Regenerate
                </button>

                {/* COPY */}

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



                {/* SAVE */}

                <button

                  onClick={saveOutput}

                  disabled={!output}

                  title="Save"

                  className="rounded-xl border border-white/10 bg-[#0b0c10] p-2.5 text-gray-300 transition hover:border-violet-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"

                >

                  <Save size={18} />

                </button>



                {/* FAVORITE */}

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



                {/* DOWNLOAD */}

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



            {/* OUTPUT AREA */}

            <div className="min-h-[430px] overflow-auto rounded-xl border border-white/10 bg-[#0b0c10] p-6">



              {/* EMPTY */}

              {!output && !busy && (

                <div className="flex min-h-[380px] flex-col items-center justify-center text-center">

                  <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-violet-400">

                    <Sparkles size={28} />

                  </div>



                  <h3 className="mb-2 text-sm font-medium text-gray-300">

                    Ready to create

                  </h3>



                  <p className="max-w-sm text-sm leading-6 text-gray-600">

                    Configure your options, enter your request,

                    and let AIForge generate your result.

                  </p>

                </div>

              )}



              {/* LOADING */}

              {busy && (

                <div className="flex min-h-[380px] items-center justify-center">

                  <div className="text-center">

                    <div className="mx-auto mb-5 h-9 w-9 animate-spin rounded-full border-2 border-violet-500/30 border-t-violet-500" />



                    <p className="text-sm text-gray-400">

                      AI is generating your result...

                    </p>



                    <p className="mt-2 text-xs text-gray-600">

                      Please wait

                    </p>

                  </div>

                </div>

              )}



              {/* IMAGE */}

              {output && isImage && (

                <div className="flex justify-center">

                  <img

                    src={output}

                    alt="AI generated"

                    className="max-h-[600px] rounded-xl object-contain"

                  />

                </div>

              )}



              {/* TEXT */}

              {output && !isImage && (

                <div className="whitespace-pre-wrap break-words leading-8 text-gray-200">

                  {output}

                </div>

              )}

                <div className="mt-4 border-t border-white/5 pt-3 text-xs text-gray-600">
                  {outputStats.words} words · {outputStats.characters} characters
                </div>

            </div>

          </div>

        </div>



        {/* BOTTOM INFO */}

        <div className="mt-6 grid gap-4 sm:grid-cols-3">



          <div className="rounded-xl border border-white/10 bg-[#101116] p-4">

            <div className="mb-2 flex items-center gap-2 text-violet-400">

              <Sparkles size={16} />

              <span className="text-sm font-medium">

                AI Powered

              </span>

            </div>



            <p className="text-xs leading-5 text-gray-500">

              Generate professional content using AIForge.

            </p>

          </div>



          <div className="rounded-xl border border-white/10 bg-[#101116] p-4">

            <div className="mb-2 flex items-center gap-2 text-violet-400">

              <Save size={16} />

              <span className="text-sm font-medium">

                Save Results

              </span>

            </div>



            <p className="text-xs leading-5 text-gray-500">

              Save useful generations to your account.

            </p>

          </div>



          <div className="rounded-xl border border-white/10 bg-[#101116] p-4">

            <div className="mb-2 flex items-center gap-2 text-violet-400">

              <Download size={16} />

              <span className="text-sm font-medium">

                Export

              </span>

            </div>



            <p className="text-xs leading-5 text-gray-500">

              Copy or download your generated result.

            </p>

          </div>



        </div>

      </div>

    </div>

  );

}