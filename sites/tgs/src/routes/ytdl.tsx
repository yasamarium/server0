import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Youtube,
  ArrowLeft,
  Search,
  Download,
  Copy,
  Check,
  Play,
  Loader2,
  AlertCircle,
  Sparkles,
  Film,
  X,
  ExternalLink,
  Clipboard
} from "lucide-react";

export const Route = createFileRoute("/ytdl")({
  head: () => ({
    meta: [
      { title: "YouTube Video Downloader — Fast MP4 Downloader" },
      { name: "description", content: "Download high quality YouTube MP4 videos directly with instant preview." },
    ],
  }),
  component: YouTubeDownloaderPage,
});

interface VideoResult {
  type: string;
  format: string;
  title: string;
  thumbnail: string;
  cover?: string;
  quality: string;
  duration?: string;
  download_url: string;
}

function YouTubeDownloaderPage() {
  const [urlInput, setUrlInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VideoResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const sampleLinks = [
    { label: "Rick Astley — Never Gonna Give You Up", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
    { label: "Alan Walker — Faded", url: "https://www.youtube.com/watch?v=60ItHLz5WEA" },
  ];

  const handleFetch = async (urlToFetch?: string) => {
    const targetUrl = (urlToFetch || urlInput).trim();
    if (!targetUrl) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setShowPreview(false);

    try {
      const res = await fetch(`/api/ytdl/download?url=${encodeURIComponent(targetUrl)}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch video (${res.status}). Check YouTube URL.`);
      }

      const data = await res.json();
      const videoResult = data.result || data.data;

      if ((data.success || data.status === 200) && videoResult?.download_url) {
        setResult({
          type: videoResult.type || "video",
          format: videoResult.format || "mp4",
          title: videoResult.title || "YouTube Video",
          thumbnail: videoResult.thumbnail || videoResult.cover || "",
          cover: videoResult.cover || videoResult.thumbnail || "",
          quality: videoResult.quality || "720p",
          duration: videoResult.duration || "",
          download_url: videoResult.download_url,
        });
      } else {
        throw new Error(data.error || data.message || "Unable to extract video download link. Video may be restricted.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to process YouTube link. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrlInput(text);
        handleFetch(text);
      }
    } catch (e) {
      console.error("Clipboard paste error:", e);
    }
  };

  const handleCopy = () => {
    if (!result?.download_url) return;
    navigator.clipboard.writeText(result.download_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="min-h-screen bg-[#050508] text-white flex flex-col font-sans relative overflow-hidden select-none pb-20">
      {/* Red Background Glow */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-red-600/10 blur-[170px] pointer-events-none rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-rose-600/10 blur-[150px] pointer-events-none rounded-full" />

      {/* Header */}
      <header className="px-5 py-4 border-b border-zinc-900/80 backdrop-blur-2xl sticky top-0 z-40 bg-[#050508]/85 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="size-9.5 rounded-full bg-zinc-900/90 border border-zinc-800 flex items-center justify-center hover:bg-zinc-800 active:scale-95 transition-all text-white shadow-md"
          >
            <ArrowLeft className="size-4.5" />
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="size-9.5 rounded-xl bg-gradient-to-tr from-red-600 via-rose-600 to-pink-600 flex items-center justify-center shadow-lg shadow-red-600/25">
              <Youtube className="size-5 text-white" />
            </div>
            <div>
              <h1 className="text-[17.5px] font-black tracking-tight leading-none text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-400">
                YT DOWNLOADER
              </h1>
              <p className="text-[9px] text-red-400 font-black tracking-widest uppercase mt-0.5">High Quality Video Downloader</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[9px] font-black text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
            720P / MP4
          </span>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 py-8 space-y-8 overflow-y-auto">

        {/* Hero Banner */}
        <div className="text-center space-y-2.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest">
            <Sparkles className="size-3.5 text-red-500" />
            <span>Instant Direct Video Downloader</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Download Any YouTube Video
          </h2>
          <p className="text-[13px] text-zinc-400 font-bold max-w-md mx-auto">
            Paste a YouTube video URL below to stream directly or download high-definition MP4 files to your device.
          </p>
        </div>

        {/* URL Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleFetch();
          }}
          className="space-y-3 max-w-xl mx-auto"
        >
          <div className="relative flex items-center">
            <Youtube className="absolute left-4 size-5 text-red-500" />
            <input
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              required
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="w-full h-13 bg-zinc-950/90 border border-zinc-800 rounded-2xl pl-12 pr-28 text-[13.5px] font-bold text-white placeholder-zinc-500 outline-none focus:border-red-500/50 transition-all shadow-2xl select-text"
            />
            <div className="absolute right-2 flex items-center gap-1">
              {urlInput ? (
                <button
                  type="button"
                  onClick={() => setUrlInput("")}
                  className="size-9 rounded-xl text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
                >
                  <X className="size-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePaste}
                  className="px-2.5 h-8.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 text-[11px] font-bold flex items-center gap-1 transition-all"
                  title="Paste from Clipboard"
                >
                  <Clipboard className="size-3.5" />
                  <span>Paste</span>
                </button>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !urlInput.trim()}
            className="w-full h-12 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 hover:brightness-110 disabled:opacity-40 text-[13px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xl shadow-red-600/20 active:scale-[0.99]"
          >
            {loading ? (
              <>
                <Loader2 className="size-4.5 animate-spin" />
                <span>Processing Video Link...</span>
              </>
            ) : (
              <>
                <Download className="size-4.5" />
                <span>Fetch Video Download</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Sample Links */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-bold text-zinc-500">
          <span className="text-zinc-600 uppercase text-[9.5px] font-black tracking-wider">Try Demo:</span>
          {sampleLinks.map((sample, idx) => (
            <button
              key={idx}
              onClick={() => {
                setUrlInput(sample.url);
                handleFetch(sample.url);
              }}
              className="px-2.5 py-1 rounded-lg bg-zinc-900/80 border border-zinc-800/80 text-zinc-400 hover:text-red-400 hover:border-red-500/30 transition-all"
            >
              {sample.label}
            </button>
          ))}
        </div>

        {/* Error Notification */}
        {error && (
          <div className="rounded-2xl border border-rose-500/25 bg-rose-500/5 text-rose-400 text-[12.5px] font-bold p-4 flex items-start gap-3 max-w-xl mx-auto select-text animate-spring-scale">
            <AlertCircle className="size-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Video Result Card */}
        {result && (
          <div className="bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 border border-red-500/30 rounded-3xl p-6 max-w-xl mx-auto shadow-2xl space-y-5 relative overflow-hidden animate-spring-scale select-text">
            <div className="absolute -top-16 -right-16 size-36 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-red-400">
                <Film className="size-4 text-red-500" />
                <span>Video Ready for Download</span>
              </div>
              <span className="text-[9.5px] bg-red-500/10 text-red-400 px-2.5 py-0.5 rounded-full font-black border border-red-500/20 uppercase">
                {result.quality || "720p HD"} • {result.format?.toUpperCase() || "MP4"}
              </span>
            </div>

            {/* Video Thumbnail / Preview Player */}
            <div className="relative rounded-2xl overflow-hidden aspect-video bg-zinc-900 border border-zinc-800 shadow-xl group">
              {showPreview ? (
                <video
                  src={result.download_url}
                  controls
                  autoPlay
                  className="w-full h-full object-contain bg-black"
                />
              ) : (
                <>
                  <img src={result.thumbnail} className="w-full h-full object-cover" alt="Video Thumbnail" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <button
                      onClick={() => setShowPreview(true)}
                      className="size-14 rounded-full bg-red-600 text-white flex items-center justify-center shadow-2xl transition-transform hover:scale-110 active:scale-95 group-hover:bg-red-500"
                      title="Play Preview Stream"
                    >
                      <Play className="size-7 fill-white ml-1" />
                    </button>
                  </div>
                  <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-black text-white flex items-center gap-1.5 border border-white/10">
                    <Sparkles className="size-3 text-red-400" />
                    <span>Click Play to Stream Preview</span>
                  </div>
                </>
              )}
            </div>

            {/* Video Meta */}
            <div className="space-y-1.5">
              <h3 className="text-[15px] font-black text-white leading-snug break-words">
                {result.title}
              </h3>
              <p className="text-[11px] font-bold text-zinc-400 flex items-center gap-2">
                <span>Format: <strong className="text-zinc-200">{result.format?.toUpperCase() || "MP4"}</strong></span>
                <span>•</span>
                <span>Quality: <strong className="text-red-400">{result.quality || "720p"}</strong></span>
              </p>
            </div>

            {/* Actions */}
            <div className="pt-2 border-t border-zinc-800/80 space-y-2.5">
              <a
                href={result.download_url}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 hover:brightness-110 text-white text-[13px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xl shadow-red-600/25 active:scale-[0.99]"
              >
                <Download className="size-4.5" />
                <span>Download MP4 Video ({result.quality || "720p"})</span>
              </a>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleCopy}
                  className="h-10 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 text-[11.5px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 active:scale-95"
                >
                  {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                  <span>{copied ? "Link Copied!" : "Copy Direct Link"}</span>
                </button>

                <a
                  href={result.download_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-10 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 text-[11.5px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <ExternalLink className="size-3.5" />
                  <span>Open Stream ↗</span>
                </a>
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
