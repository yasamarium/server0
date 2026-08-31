import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getFileInfo, scrapeDirectUrl } from "../lib/fi-resolver";
import {
  Download, FileText, Copy, Check, ExternalLink, ArrowLeft, ShieldCheck,
  Zap, File as FileIcon, Image as ImageIcon, Video, Music, Archive, AlertCircle,
} from "lucide-react";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Range, Accept, Origin",
  "Access-Control-Max-Age": "86400",
};

export const Route = createFileRoute("/fi/$")({
  component: FiFileView,
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: async ({ params, request }) => {
        const splat = (params as any)["_splat"] || "";
        const parts = splat.split("/").filter(Boolean);
        const fileId = parts[0] || "";
        const url = new URL(request.url);
        const isDownload = parts.includes("download") || url.searchParams.get("dl") === "1";

        if (!isDownload || !fileId) return undefined;

        // Resolve direct /dl/ URL then proxy/stream the file through our domain
        const directUrl = await scrapeDirectUrl(fileId);
        if (!directUrl) {
          return new Response("File not found or expired.", { status: 404, headers: CORS });
        }

        // Stream file through our domain — no redirect to external URL
        const upstream = await fetch(directUrl, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
        });

        if (!upstream.ok || !upstream.body) {
          return new Response("File not found or expired.", { status: 404, headers: CORS });
        }

        // Pass through content headers from upstream
        const headers: Record<string, string> = { ...CORS };
        const ct = upstream.headers.get("content-type");
        const cd = upstream.headers.get("content-disposition");
        const cl = upstream.headers.get("content-length");
        if (ct) headers["Content-Type"] = ct;
        if (cd) headers["Content-Disposition"] = cd;
        if (cl) headers["Content-Length"] = cl;

        return new Response(upstream.body as any, { status: 200, headers });
      },
    },
  },
});

function icon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (["jpg","jpeg","png","gif","webp","svg","bmp"].includes(ext)) return <ImageIcon className="size-10 text-cyan-400" />;
  if (["mp4","webm","mkv","mov","avi","flv"].includes(ext)) return <Video className="size-10 text-cyan-400" />;
  if (["mp3","wav","ogg","m4a","flac","aac"].includes(ext)) return <Music className="size-10 text-cyan-400" />;
  if (["zip","rar","tar","gz","7z"].includes(ext)) return <Archive className="size-10 text-cyan-400" />;
  if (["txt","md","json","js","ts","html","css","py","pdf"].includes(ext)) return <FileText className="size-10 text-cyan-400" />;
  return <FileIcon className="size-10 text-cyan-400" />;
}

function FiFileView() {
  const params = Route.useParams();
  const splat = (params as any)["_splat"] || "";
  const fileId = splat.split("/").filter(Boolean)[0] || "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<{ id: string; filename: string; readableSize: string; directUrl: string | null } | null>(null);
  const [copied, setCopied] = useState(false);

  const dlUrl = typeof window !== "undefined" ? `${window.location.origin}/fi/${fileId}/download` : `/fi/${fileId}/download`;

  useEffect(() => {
    if (!fileId) return;
    setLoading(true);
    fetch(`/api/fi/download?id=${encodeURIComponent(fileId)}&redirect=false`)
      .then(r => r.json())
      .then(d => {
        if (d.success) setFile({ id: d.id, filename: d.filename, readableSize: d.readableSize || "", directUrl: d.directUrl });
        else setError(d.error || "File not found or expired.");
      })
      .catch(() => setError("Network error."))
      .finally(() => setLoading(false));
  }, [fileId]);

  const copy = async () => { await navigator.clipboard.writeText(dlUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div className="min-h-screen bg-[#070709] text-white flex flex-col items-center justify-center p-4 font-sans select-none relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 size-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 size-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md space-y-6">
        <div className="flex items-center justify-between">
          <Link to="/fi" className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-cyan-400 transition-colors">
            <ArrowLeft className="size-3.5" /><span>Back to Cloud Drop</span>
          </Link>
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-mono font-bold text-cyan-300">
            <Zap className="size-3" /><span>Direct File</span>
          </div>
        </div>

        <div className="p-6 sm:p-8 rounded-3xl bg-zinc-900/60 border border-white/10 shadow-2xl backdrop-blur-2xl text-center space-y-6">
          {loading ? (
            <div className="py-12 space-y-4">
              <div className="size-12 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold text-zinc-400">Resolving file...</p>
            </div>
          ) : error ? (
            <div className="py-8 space-y-4">
              <div className="size-16 rounded-3xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-400">
                <AlertCircle className="size-8" />
              </div>
              <h3 className="text-lg font-black">File Unavailable</h3>
              <p className="text-xs text-zinc-400">{error}</p>
              <Link to="/fi" className="inline-block px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs transition-all shadow-lg shadow-cyan-600/20">
                Upload a New File
              </Link>
            </div>
          ) : file ? (
            <>
              <div className="space-y-3">
                <div className="size-20 rounded-3xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center mx-auto shadow-xl shadow-cyan-500/10">
                  {icon(file.filename)}
                </div>
                <h3 className="text-lg font-black tracking-tight break-all line-clamp-2">{file.filename}</h3>
                {file.readableSize && (
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono font-bold text-zinc-400">
                    {file.readableSize}
                  </span>
                )}
              </div>
              <div className="space-y-3 pt-2">
                <a href={dlUrl} className="w-full h-12 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/25 transition-all active:scale-95 group">
                  <Download className="size-4.5 group-hover:translate-y-0.5 transition-transform" />
                  <span>Download File</span>
                </a>
                <button type="button" onClick={copy} className="w-full h-11 rounded-2xl bg-zinc-800/80 hover:bg-zinc-800 border border-white/10 text-zinc-200 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95">
                  {copied ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4 text-zinc-400" />}
                  <span>{copied ? "Copied!" : "Copy Download Link"}</span>
                </button>
              </div>
              <div className="pt-2 border-t border-white/5 flex items-center justify-center gap-1.5 text-[11px] text-zinc-500">
                <ShieldCheck className="size-3.5 text-emerald-400" />
                <span>Direct File Download • No Ads</span>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
