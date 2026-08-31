import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Instagram,
  Download,
  Copy,
  Check,
  ArrowLeft,
  Loader2,
  Play,
  Heart,
  MessageCircle,
  AlertTriangle,
  Film,
  Sparkles,
} from "lucide-react";

interface InstagramResult {
  video: string | null;
  thumbnail: string | null;
  title: string;
  quality?: string;
  likeCount?: number | null;
  commentCount?: number | null;
  format?: string;
}

function InstagramDownloaderPage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<InstagramResult | null>(null);
  const [copied, setCopied] = useState(false);

  const sampleReelUrl = "https://www.instagram.com/reel/DVydQvZDAfr/";

  const handleFetchReel = async (targetUrl?: string) => {
    const inputUrl = (targetUrl || url).trim();
    if (!inputUrl) {
      setError("Please enter a valid Instagram Reel or Video URL.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/instagram/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: inputUrl }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.result) {
        throw new Error(data.error || "Failed to download Instagram reel.");
      }

      setResult(data.result);
    } catch (err: any) {
      setError(err.message || "Unable to download this reel. Ensure the account is public.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasteSample = () => {
    setUrl(sampleReelUrl);
    handleFetchReel(sampleReelUrl);
  };

  const handleCopyLink = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatNumber = (num: number | null | undefined) => {
    if (!num) return null;
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toLocaleString();
  };

  return (
    <main className="min-h-screen bg-[#000000] text-foreground font-sans relative selection:bg-white/20">
      {/* Header Banner */}
      <header className="px-4 sm:px-6 md:px-8 py-4 border-b border-zinc-800/80 sticky top-0 z-40 bg-[#000000]/95 backdrop-blur-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="size-9 rounded-xl bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-all border border-zinc-800"
              title="Back to Home"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-zinc-900 text-white border border-zinc-800">
                  <Instagram className="size-4" />
                </span>
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">
                  Instagram Downloader
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-zinc-900 text-amber-400 border border-amber-500/20 text-[10px] font-mono font-bold tracking-wider">
                  BETA
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handlePasteSample}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold transition-all"
          >
            <Film className="size-3.5" />
            <span>Try Sample Reel</span>
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-8 space-y-6">
        {/* BETA Notice Banner */}
        <div className="p-4 rounded-2xl border border-zinc-800 bg-[#09090b] text-zinc-400 text-xs font-normal flex items-start gap-3">
          <AlertTriangle className="size-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-zinc-200 font-semibold">BETA Feature Notice:</strong> This tool is currently in public BETA. Private or restricted Instagram posts require standard public visibility.
          </div>
        </div>

        {/* Downloader Card */}
        <div className="p-6 sm:p-7 rounded-2xl border border-zinc-800 bg-[#09090b] space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-zinc-300 flex items-center gap-2">
              <span>Instagram Post or Reel URL</span>
            </label>
            <button
              onClick={handlePasteSample}
              className="text-[11px] text-zinc-400 hover:text-white font-mono underline sm:hidden"
            >
              Try Sample
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleFetchReel();
            }}
            className="flex flex-col sm:flex-row gap-2.5"
          >
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.instagram.com/reel/..."
              className="flex-1 h-11 px-4 rounded-xl bg-[#000000] border border-zinc-800 text-xs sm:text-sm font-mono font-medium text-white placeholder:text-zinc-600 outline-none focus:border-zinc-500 transition-colors"
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="h-11 px-6 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs uppercase tracking-wide transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 flex-shrink-0"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Fetching...</span>
                </>
              ) : (
                <>
                  <Download className="size-4" />
                  <span>Fetch Reel</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="py-12 text-center space-y-3 rounded-2xl border border-zinc-800 bg-[#09090b]">
            <Loader2 className="size-8 animate-spin mx-auto text-zinc-400" />
            <p className="text-xs text-zinc-400 font-mono">Fetching video stream & metadata...</p>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-2xl border border-red-900/50 bg-red-950/20 text-red-300 text-xs font-medium text-center space-y-1">
            <p>{error}</p>
            <p className="text-[11px] text-zinc-500">Ensure the reel link is public.</p>
          </div>
        )}

        {/* Result Card */}
        {result && (
          <div className="p-6 sm:p-7 rounded-2xl border border-zinc-800 bg-[#09090b] space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 font-mono">
                <span className="size-2 rounded-full bg-emerald-400" />
                Media Ready
              </span>
              {result.quality && (
                <span className="px-2.5 py-0.5 rounded-md bg-zinc-900 text-zinc-300 border border-zinc-800 text-[10px] font-mono">
                  {result.quality} MP4
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Media Preview */}
              <div className="md:col-span-5 relative rounded-xl overflow-hidden border border-zinc-800 bg-black aspect-[9/16] max-h-[340px] mx-auto w-full flex items-center justify-center">
                {result.video ? (
                  <video
                    src={result.video}
                    poster={result.thumbnail || undefined}
                    controls
                    className="w-full h-full object-contain"
                  />
                ) : result.thumbnail ? (
                  <div className="relative size-full">
                    <img
                      src={result.thumbnail}
                      alt="Reel preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="size-12 rounded-full bg-white/90 text-black flex items-center justify-center">
                        <Play className="size-5 fill-current ml-0.5" />
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Title & Download Details */}
              <div className="md:col-span-7 space-y-4">
                <div className="space-y-1.5">
                  <span className="text-[11px] font-mono text-zinc-500 uppercase">Caption</span>
                  <div className="p-3.5 rounded-xl bg-[#000000] border border-zinc-800 text-xs text-zinc-300 leading-relaxed max-h-40 overflow-y-auto whitespace-pre-wrap">
                    {result.title}
                  </div>
                </div>

                {(result.likeCount || result.commentCount) && (
                  <div className="flex items-center gap-3 text-xs font-mono">
                    {result.likeCount && (
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-900 text-zinc-300 border border-zinc-800">
                        <Heart className="size-3 text-red-400 fill-current" />
                        <span>{formatNumber(result.likeCount)}</span>
                      </span>
                    )}
                    {result.commentCount && (
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-900 text-zinc-300 border border-zinc-800">
                        <MessageCircle className="size-3 text-zinc-400" />
                        <span>{formatNumber(result.commentCount)}</span>
                      </span>
                    )}
                  </div>
                )}

                <div className="space-y-2 pt-2">
                  {result.video && (
                    <a
                      href={result.video}
                      target="_blank"
                      rel="noopener noreferrer"
                      download="instagram_reel.mp4"
                      className="w-full py-3.5 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs uppercase tracking-wide transition-all flex items-center justify-center gap-2"
                    >
                      <Download className="size-4" />
                      <span>Download Video (MP4)</span>
                    </a>
                  )}

                  {result.video && (
                    <button
                      onClick={() => handleCopyLink(result.video!)}
                      className="w-full py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium transition-all flex items-center justify-center gap-2"
                    >
                      {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                      <span>{copied ? "Link Copied" : "Copy Direct Video Link"}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export const Route = createFileRoute("/instagram")({
  component: InstagramDownloaderPage,
  head: () => ({
    meta: [
      { title: "Instagram Downloader • BETA" },
      { name: "description", content: "Download Instagram Reels and videos with thumbnail preview and direct MP4 export." },
    ],
  }),
});
