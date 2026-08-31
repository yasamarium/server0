import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Sparkles,
  Download,
  Copy,
  Check,
  ArrowLeft,
  Loader2,
  Image as ImageIcon,
  Wand2,
  Palette,
  Camera,
  Maximize2,
  Share2,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
} from "lucide-react";

interface GeneratedImage {
  prompt: string;
  model: "flux" | "animagine" | "epicrealism";
  directUrl: string;
  origUrl: string;
  createdAt: string;
}

function AIImageStudioPage() {
  const [model, setModel] = useState<"flux" | "animagine" | "epicrealism">("flux");
  const [prompt, setPrompt] = useState("cyberpunk city, neon lights, rain, futuristic, detailed, 4k");
  const [loading, setLoading] = useState(false);
  const [currentImage, setCurrentImage] = useState<GeneratedImage | null>(null);
  const [error, setError] = useState("");
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [fullscreenModal, setFullscreenModal] = useState(false);

  const [history, setHistory] = useState<GeneratedImage[]>([]);

  const samplePrompts: Record<string, string[]> = {
    flux: [
      "cyberpunk city, neon lights, rain, futuristic, detailed",
      "futuristic sports car driving through glowing neon highway",
      "ethereal floating island with mystical waterfall and cosmic sky",
    ],
    animagine: [
      "beautiful anime girl, cherry blossoms, sunset, detailed, 4k",
      "cool anime swordsman in stormy background with lightning effects",
      "cute anime cat girl in colorful coffee shop, pastel colors",
    ],
    epicrealism: [
      "photorealistic portrait of a warrior, intricate armor, dramatic lighting, 8k",
      "cinematic shot of an ancient mountain castle during golden hour",
      "hyperrealistic tiger walking in autumn forest, masterpiece",
    ],
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ai_image_history");
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch {}
  }, []);

  const saveToHistory = (img: GeneratedImage) => {
    try {
      const updated = [img, ...history.filter((h) => h.directUrl !== img.directUrl)].slice(0, 12);
      setHistory(updated);
      localStorage.setItem("ai_image_history", JSON.stringify(updated));
    } catch {}
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim()) {
      setError("Please enter an image prompt.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/image/generate?prompt=${encodeURIComponent(prompt.trim())}&model=${model}`);
      const data = await res.json();

      if (!res.ok || !data.success || !data.directUrl) {
        throw new Error(data.error || "Failed to generate AI image.");
      }

      let finalDirectUrl = data.directUrl;

      // Extra client-side fallback if tmpfiles HTML needs browser session expansion
      if (finalDirectUrl && finalDirectUrl.includes("tmpfiles.org/dl/")) {
        const parts = finalDirectUrl.split("tmpfiles.org/dl/")[1]?.split("/");
        if (parts && parts.length === 2) {
          try {
            const pageRes = await fetch(finalDirectUrl);
            if (pageRes.ok) {
              const html = await pageRes.text();
              const m = html.match(/<img[^>]+src=["'](https?:\/\/[^"']*tmpfiles\.org\/dl\/[^"']+)["']/i) || html.match(/<a[^>]+href=["'](https?:\/\/[^"']*tmpfiles\.org\/dl\/[^"']+)["']/i);
              if (m && m[1]) {
                finalDirectUrl = m[1];
              }
            }
          } catch {}
        }
      }

      const newImg: GeneratedImage = {
        prompt: prompt.trim(),
        model,
        directUrl: finalDirectUrl,
        origUrl: data.origUrl || data.directUrl,
        createdAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setCurrentImage(newImg);
      saveToHistory(newImg);
    } catch (err: any) {
      setError(err.message || "Failed to generate AI image.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const getModelBadge = (m: string) => {
    if (m === "animagine") return "Anime Art";
    if (m === "epicrealism") return "Photorealistic";
    return "Flux v2";
  };

  return (
    <main className="min-h-screen bg-[#000000] text-foreground font-sans relative selection:bg-white/20 pb-24 overflow-x-hidden">
      {/* Glow Backdrop */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[450px] bg-gradient-to-b from-sky-900/15 via-purple-900/10 to-transparent blur-[120px] pointer-events-none" />

      {/* iOS Translucent Sticky Header */}
      <header className="px-4 sm:px-6 md:px-8 py-4 border-b border-zinc-800/80 sticky top-0 z-40 bg-[#000000]/90 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="size-9 rounded-2xl bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-all border border-zinc-800/80 active:scale-95"
              title="Back to Home"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-zinc-900 text-sky-400 border border-zinc-800">
                  <Sparkles className="size-4" />
                </span>
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">
                  AI Image Studio
                </h1>
              </div>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-full bg-zinc-900 text-sky-400 border border-zinc-800 text-[10px] font-mono font-bold tracking-wider uppercase">
            3 MODELS
          </span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-7 relative z-10">
        {/* Model Selection Tabs */}
        <div className="grid grid-cols-3 gap-2 p-1.5 rounded-3xl bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-md">
          <button
            onClick={() => {
              setModel("flux");
              setPrompt(samplePrompts.flux[0]);
            }}
            className={`py-3 px-2 rounded-2xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-2 active:scale-95 ${
              model === "flux"
                ? "bg-white text-black shadow-lg shadow-white/10"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Wand2 className="size-4 text-sky-500" />
            <div className="text-center sm:text-left">
              <div>Flux v2</div>
              <div className="text-[9px] font-mono opacity-70 hidden sm:block">General AI</div>
            </div>
          </button>

          <button
            onClick={() => {
              setModel("animagine");
              setPrompt(samplePrompts.animagine[0]);
            }}
            className={`py-3 px-2 rounded-2xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-2 active:scale-95 ${
              model === "animagine"
                ? "bg-white text-black shadow-lg shadow-white/10"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Palette className="size-4 text-pink-500" />
            <div className="text-center sm:text-left">
              <div>Animagine</div>
              <div className="text-[9px] font-mono opacity-70 hidden sm:block">Anime Art</div>
            </div>
          </button>

          <button
            onClick={() => {
              setModel("epicrealism");
              setPrompt(samplePrompts.epicrealism[0]);
            }}
            className={`py-3 px-2 rounded-2xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-2 active:scale-95 ${
              model === "epicrealism"
                ? "bg-white text-black shadow-lg shadow-white/10"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Camera className="size-4 text-amber-500" />
            <div className="text-center sm:text-left">
              <div>Epic Realism</div>
              <div className="text-[9px] font-mono opacity-70 hidden sm:block">8K Photo</div>
            </div>
          </button>
        </div>

        {/* Prompt Input Form */}
        <form onSubmit={handleGenerate} className="p-6 rounded-3xl border border-zinc-800 bg-[#09090b] space-y-4 shadow-2xl">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <span className="text-xs font-bold text-white flex items-center gap-2">
              <Sparkles className="size-4 text-sky-400" />
              Image Generation Prompt
            </span>
            <span className="text-[10px] font-mono text-zinc-500 uppercase">
              Model: {getModelBadge(model)}
            </span>
          </div>

          {error && (
            <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono">
              {error}
            </div>
          )}

          <textarea
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the image you want to generate in detail..."
            className="w-full p-4 rounded-2xl bg-[#000000] border border-zinc-800 text-xs sm:text-sm font-mono text-white placeholder:text-zinc-600 outline-none focus:border-sky-500/50 leading-relaxed resize-y"
          />

          {/* Sample Prompts */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono text-zinc-500">Sample Prompts (Click to use):</span>
            <div className="flex flex-wrap gap-2">
              {samplePrompts[model].map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPrompt(sample)}
                  className="px-3 py-1 rounded-full bg-[#000000] hover:bg-zinc-800 border border-zinc-800 text-[10px] font-mono text-zinc-400 hover:text-white transition-all text-left truncate max-w-full"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="w-full h-12 rounded-2xl bg-white hover:bg-zinc-200 text-black font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-40 shadow-lg"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Rendering AI Image...</span>
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                <span>Generate AI Image</span>
              </>
            )}
          </button>
        </form>

        {/* GENERATED IMAGE DISPLAY CANVAS */}
        {currentImage && (
          <div className="p-6 sm:p-7 rounded-3xl border border-zinc-800 bg-[#09090b] space-y-5 shadow-2xl animate-spring-scale">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[10px] font-mono font-bold uppercase">
                  {getModelBadge(currentImage.model)}
                </span>
                <span className="text-[10px] font-mono text-zinc-500">{currentImage.createdAt}</span>
              </div>

              <button
                onClick={() => setFullscreenModal(true)}
                className="text-[11px] font-mono text-zinc-400 hover:text-white flex items-center gap-1"
              >
                <Maximize2 className="size-3" />
                <span>Fullscreen</span>
              </button>
            </div>

            {/* Direct PNG Image Load */}
            <div className="relative rounded-2xl overflow-hidden bg-black border border-zinc-800 group">
              <img
                src={currentImage.directUrl}
                alt={currentImage.prompt}
                className="w-full max-h-[500px] object-contain mx-auto transition-all duration-300"
                loading="eager"
              />
            </div>

            {/* Prompt display */}
            <p className="text-xs font-mono text-zinc-300 bg-[#000000] p-3 rounded-2xl border border-zinc-800/80 leading-relaxed">
              <span className="text-zinc-500 font-bold uppercase">Prompt: </span>
              {currentImage.prompt}
            </p>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <a
                href={`/api/public/download?url=${encodeURIComponent(currentImage.directUrl)}&name=${encodeURIComponent(`${currentImage.model}_image.png`)}`}
                download={`${currentImage.model}_image.png`}
                className="flex-1 h-11 px-5 rounded-2xl bg-white hover:bg-zinc-200 text-black font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95 shadow-md"
              >
                <Download className="size-4" />
                <span>Download .PNG Image</span>
              </a>

              <button
                onClick={() => handleCopyUrl(currentImage.directUrl)}
                className="h-11 px-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-bold text-xs transition-all flex items-center justify-center gap-2"
              >
                {copiedUrl ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4" />}
                <span>{copiedUrl ? "Copied Link" : "Copy PNG Link"}</span>
              </button>

              <a
                href={currentImage.directUrl}
                target="_blank"
                rel="noreferrer"
                className="h-11 px-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                title="Open Direct PNG"
              >
                <ExternalLink className="size-4" />
              </a>
            </div>
          </div>
        )}

        {/* FULLSCREEN MODAL */}
        {fullscreenModal && currentImage && (
          <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4">
            <button
              onClick={() => setFullscreenModal(false)}
              className="absolute top-6 right-6 p-2 rounded-2xl bg-zinc-900 text-white border border-zinc-800 text-xs font-bold"
            >
              Close ✕
            </button>
            <img
              src={currentImage.directUrl}
              alt="Fullscreen AI Art"
              className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
            />
          </div>
        )}

        {/* RECENT GALLERY HISTORY */}
        {history.length > 0 && (
          <div className="p-6 rounded-3xl border border-zinc-800 bg-[#09090b] space-y-4">
            <div className="flex items-center justify-between text-xs font-bold text-white">
              <span>Recent AI Generations</span>
              <button
                onClick={() => {
                  setHistory([]);
                  localStorage.removeItem("ai_image_history");
                }}
                className="text-[10px] font-mono text-zinc-500 hover:text-red-400"
              >
                Clear Gallery
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {history.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => setCurrentImage(item)}
                  className="group relative aspect-square rounded-2xl overflow-hidden bg-black border border-zinc-800/80 hover:border-sky-500/50 cursor-pointer transition-all active:scale-95"
                >
                  <img
                    src={item.directUrl}
                    alt={item.prompt}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-between">
                    <span className="self-end px-2 py-0.5 rounded-full bg-black/60 text-sky-400 text-[9px] font-mono font-bold">
                      {getModelBadge(item.model)}
                    </span>
                    <p className="text-[10px] font-mono text-white truncate">{item.prompt}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export const Route = createFileRoute("/ai-image")({
  component: AIImageStudioPage,
  head: () => ({
    meta: [
      { title: "AI Image Studio • Flux v2, Animagine & Epic Realism" },
      { name: "description", content: "Generate high-resolution AI images with direct PNG downloads powered by Flux v2, Animagine & Epic Realism." },
    ],
  }),
});
