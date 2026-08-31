import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef } from "react";
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
  X,
  ExternalLink,
  Clipboard,
  Music2,
  Tv
} from "lucide-react";

export const Route = createFileRoute("/ytstream")({
  head: () => ({
    meta: [
      { title: "YouTube Stream — Minimal Player" },
      { name: "description", content: "Minimalist YouTube video search feed, direct high-speed video streaming & MP4 downloads." },
    ],
  }),
  component: YouTubeStreamPage,
});

interface SearchResultItem {
  title: string;
  videoId: string;
  url: string;
  thumbnail: string;
  views: number;
  duration: string;
  published: string;
}

interface StreamData {
  type: string;
  format: string;
  title: string;
  thumbnail: string;
  quality: string;
  download_url: string;
}

function formatViewsCount(num: number): string {
  if (!num) return "0 views";
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B views`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M views`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K views`;
  return `${num.toLocaleString()} views`;
}

function YouTubeStreamPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [feedResults, setFeedResults] = useState<SearchResultItem[]>([]);
  
  // Player state
  const [selectedVideo, setSelectedVideo] = useState<SearchResultItem | null>(null);
  const [streamLoading, setStreamLoading] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [streamData, setStreamData] = useState<StreamData | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [playerMode, setPlayerMode] = useState<"video" | "audio">("video");

  const playerRef = useRef<HTMLDivElement | null>(null);

  const handleSearch = async (queryToSearch?: string) => {
    const query = (queryToSearch !== undefined ? queryToSearch : searchQuery).trim();
    if (!query) return;

    setSearching(true);
    setSearchError(null);

    try {
      const res = await fetch(`/api/ytstream/search?query=${encodeURIComponent(query)}`);
      if (!res.ok) {
        throw new Error(`Search request failed (${res.status}). Please try again.`);
      }

      const data = await res.json();
      if (data.results && Array.isArray(data.results)) {
        setFeedResults(data.results);
        if (data.results.length === 0) {
          setSearchError("No videos found matching your query.");
        }
      } else if (data.status === false || data.error) {
        throw new Error(data.error || "Failed to parse search results.");
      } else {
        setFeedResults([]);
        setSearchError("Unexpected response format from search service.");
      }
    } catch (err: any) {
      setSearchError(err.message || "Failed to fetch YouTube search feed.");
      setFeedResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleStreamVideo = async (item: SearchResultItem) => {
    setSelectedVideo(item);
    setStreamLoading(true);
    setStreamError(null);
    setStreamData(null);

    if (playerRef.current) {
      playerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    try {
      const res = await fetch(`/api/ytdl/download?url=${encodeURIComponent(item.url)}`);
      if (!res.ok) {
        throw new Error(`Stream resolution error (${res.status}). Could not extract video stream.`);
      }

      const data = await res.json();
      const streamRes = data.result || data.data;

      if ((data.success || data.status === 200) && streamRes?.download_url) {
        setStreamData({
          type: streamRes.type || "video",
          format: streamRes.format || "mp4",
          title: streamRes.title || item.title,
          thumbnail: streamRes.thumbnail || streamRes.cover || item.thumbnail,
          quality: streamRes.quality || "720p",
          download_url: streamRes.download_url,
        });
      } else {
        throw new Error(data.error || data.message || "Failed to retrieve stream URL for this video.");
      }
    } catch (err: any) {
      setStreamError(err.message || "Failed to load direct stream. Video may be restricted.");
    } finally {
      setStreamLoading(false);
    }
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setSearchQuery(text);
        handleSearch(text);
      }
    } catch (e) {
      console.error("Paste error:", e);
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(id);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  return (
    <main className="min-h-screen bg-[#050508] text-white flex flex-col font-sans relative overflow-x-hidden select-none pb-28 antialiased">
      {/* Translucent Header */}
      <header className="px-4 sm:px-8 py-3.5 border-b border-white/5 backdrop-blur-2xl sticky top-0 z-40 bg-[#050508]/80 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="size-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center active:scale-95 transition-all text-white"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-full bg-red-600 flex items-center justify-center shadow-md">
              <Youtube className="size-4 text-white" />
            </div>
            <h1 className="text-sm font-semibold tracking-tight text-white">
              YouTube Stream
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">

        {/* Minimal Hero */}
        <div className="text-center space-y-1.5 max-w-md mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Stream YouTube
          </h2>
          <p className="text-xs text-zinc-400 font-normal leading-relaxed">
            Search any video to stream directly or download MP4.
          </p>
        </div>

        {/* Search Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="max-w-xl mx-auto"
        >
          <div className="relative flex items-center bg-zinc-900/70 border border-white/10 rounded-full p-1.5 backdrop-blur-xl transition-all focus-within:border-red-500/40 focus-within:ring-2 focus-within:ring-red-500/20">
            <Search className="ml-3.5 size-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search YouTube..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent px-3 text-xs font-normal text-white placeholder:text-zinc-500 outline-none select-text"
            />
            <div className="flex items-center gap-1 pr-1">
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="size-7 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors"
                >
                  <X className="size-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handlePasteClipboard}
                  className="px-2.5 h-7 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-300 text-[11px] font-medium flex items-center gap-1 transition-all"
                  title="Paste from Clipboard"
                >
                  <Clipboard className="size-3" />
                  <span>Paste</span>
                </button>
              )}

              <button
                type="submit"
                disabled={searching || !searchQuery.trim()}
                className="px-4 h-8 rounded-full bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white text-xs font-medium transition-all flex items-center gap-1.5 shadow-md active:scale-95 flex-shrink-0"
              >
                {searching ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <span>Search</span>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* ACTIVE STREAM PLAYER SHEET */}
        <div ref={playerRef}>
          {selectedVideo && (
            <div className="bg-zinc-900/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-4 relative overflow-hidden animate-spring-scale select-text my-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2 text-xs font-medium text-zinc-300">
                  <span className="size-2 rounded-full bg-red-500 animate-pulse" />
                  <span>Now Streaming</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-zinc-950/80 border border-white/10 rounded-full p-1 text-xs">
                    <button
                      onClick={() => setPlayerMode("video")}
                      className={`px-3 py-0.5 rounded-full text-[11px] font-medium transition-all ${
                        playerMode === "video"
                          ? "bg-white/15 text-white shadow-sm font-semibold"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      <Tv className="size-3 inline mr-1" />
                      Video
                    </button>
                    <button
                      onClick={() => setPlayerMode("audio")}
                      className={`px-3 py-0.5 rounded-full text-[11px] font-medium transition-all ${
                        playerMode === "audio"
                          ? "bg-white/15 text-white shadow-sm font-semibold"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      <Music2 className="size-3 inline mr-1" />
                      Audio
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedVideo(null);
                      setStreamData(null);
                    }}
                    className="size-7 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all"
                    title="Close Player"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              </div>

              {/* Player Viewport */}
              <div className="relative rounded-2xl overflow-hidden aspect-video bg-black border border-white/10 shadow-xl flex items-center justify-center">
                {streamLoading ? (
                  <div className="flex flex-col items-center justify-center space-y-2 p-6 text-center">
                    <Loader2 className="size-7 animate-spin text-red-500" />
                    <p className="text-xs text-zinc-400 font-medium">Loading stream...</p>
                  </div>
                ) : streamError ? (
                  <div className="p-6 text-center space-y-2 max-w-md">
                    <AlertCircle className="size-6 text-rose-400 mx-auto" />
                    <p className="text-xs font-medium text-rose-300">{streamError}</p>
                    <button
                      onClick={() => handleStreamVideo(selectedVideo)}
                      className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-medium text-white hover:bg-white/20"
                    >
                      Retry
                    </button>
                  </div>
                ) : streamData ? (
                  playerMode === "video" ? (
                    <video
                      src={streamData.download_url}
                      controls
                      autoPlay
                      className="w-full h-full object-contain bg-black"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 p-6 relative">
                      <img
                        src={streamData.thumbnail || selectedVideo.thumbnail}
                        className="absolute inset-0 w-full h-full object-cover opacity-15 blur-2xl"
                        alt="Background"
                      />
                      <div className="relative z-10 flex flex-col items-center space-y-3 text-center">
                        <img
                          src={streamData.thumbnail || selectedVideo.thumbnail}
                          className="size-28 rounded-2xl object-cover shadow-xl border border-white/10"
                          alt="Cover"
                        />
                        <audio src={streamData.download_url} controls autoPlay className="w-60 sm:w-72" />
                      </div>
                    </div>
                  )
                ) : (
                  <img
                    src={selectedVideo.thumbnail}
                    className="w-full h-full object-cover"
                    alt="Thumbnail"
                  />
                )}
              </div>

              {/* Title & Metadata */}
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-semibold text-white tracking-tight leading-snug break-words">
                  {streamData?.title || selectedVideo.title}
                </h3>
                <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400 font-normal">
                  <span>{formatViewsCount(selectedVideo.views)}</span>
                  <span>•</span>
                  <span>{selectedVideo.duration}</span>
                  <span>•</span>
                  <span>{selectedVideo.published}</span>
                </div>
              </div>

              {/* Actions */}
              {streamData && (
                <div className="pt-2 border-t border-white/5 space-y-2">
                  <a
                    href={streamData.download_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="w-full h-10 rounded-full bg-red-600 hover:bg-red-500 text-white text-xs font-medium transition-all flex items-center justify-center gap-2 shadow-md active:scale-[0.99]"
                  >
                    <Download className="size-3.5" />
                    <span>Download MP4</span>
                  </a>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleCopyText(streamData.download_url, "stream_link")}
                      className="h-8.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 text-xs font-medium transition-all flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      {copiedLink === "stream_link" ? (
                        <Check className="size-3 text-emerald-400" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                      <span>{copiedLink === "stream_link" ? "Copied!" : "Copy Link"}</span>
                    </button>

                    <a
                      href={selectedVideo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-8.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 text-xs font-medium transition-all flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <ExternalLink className="size-3 text-zinc-400" />
                      <span>YouTube</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Search Error */}
        {searchError && (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 text-rose-300 text-xs font-medium p-3.5 flex items-start gap-2.5 max-w-xl mx-auto backdrop-blur-md">
            <AlertCircle className="size-4 flex-shrink-0 mt-0.5 text-rose-400" />
            <span>{searchError}</span>
          </div>
        )}

        {/* SEARCH RESULTS FEED */}
        <div className="space-y-3">
          {feedResults.length > 0 && (
            <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
              <span className="text-xs font-medium text-zinc-400">
                {feedResults.length} Results
              </span>

              {searching && (
                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <Loader2 className="size-3.5 animate-spin text-red-500" />
                  <span>Searching...</span>
                </div>
              )}
            </div>
          )}

          {/* Grid Feed */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {feedResults.map((item, idx) => (
              <div
                key={item.videoId || idx}
                className="group bg-zinc-900/40 border border-white/5 hover:border-white/15 rounded-2xl overflow-hidden flex flex-col transition-all duration-200 hover:shadow-xl backdrop-blur-md"
              >
                {/* Video Thumbnail */}
                <div className="relative aspect-video bg-zinc-950 overflow-hidden">
                  <img
                    src={item.thumbnail}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    alt={item.title}
                    loading="lazy"
                  />
                  
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={() => handleStreamVideo(item)}
                      className="size-10 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform"
                      title="Stream Video"
                    >
                      <Play className="size-4 fill-white ml-0.5" />
                    </button>
                  </div>

                  {item.duration && (
                    <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md text-[10px] font-medium text-zinc-200 px-1.5 py-0.5 rounded border border-white/10">
                      {item.duration}
                    </div>
                  )}
                </div>

                {/* Card Info */}
                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold text-white line-clamp-2 leading-snug group-hover:text-red-400 transition-colors">
                      {item.title}
                    </h4>
                    <div className="flex items-center gap-1 text-[11px] text-zinc-400 font-normal">
                      <span>{formatViewsCount(item.views)}</span>
                      <span>•</span>
                      <span>{item.published}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-white/5 flex items-center gap-1.5">
                    <button
                      onClick={() => handleStreamVideo(item)}
                      className="flex-1 h-8 rounded-full bg-white/5 hover:bg-red-600 border border-white/10 text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-all active:scale-95"
                    >
                      <Play className="size-3 fill-white" />
                      <span>Stream</span>
                    </button>

                    <button
                      onClick={() => handleCopyText(item.url, item.videoId)}
                      className="size-8 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-all active:scale-95"
                      title="Copy Link"
                    >
                      {copiedLink === item.videoId ? (
                        <Check className="size-3 text-emerald-400" />
                      ) : (
                        <Copy className="size-3" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {!searching && feedResults.length === 0 && !searchError && (
            <div className="py-20 text-center text-zinc-500 space-y-2">
              <Search className="size-7 mx-auto text-zinc-600 stroke-[1.5]" />
              <p className="text-xs font-normal">Search any YouTube video to start streaming</p>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
