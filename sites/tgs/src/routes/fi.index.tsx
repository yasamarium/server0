import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { 
  Upload, 
  File as FileIcon, 
  Copy, 
  Check, 
  ExternalLink, 
  Trash2, 
  Clock, 
  HardDrive, 
  Sun, 
  Moon,
  Video,
  Music,
  FileText,
  Archive,
  Image as ImageIcon,
  Download,
  ShieldCheck,
  Zap,
  Sparkles,
  Link2,
  Share2
} from "lucide-react";

export const Route = createFileRoute("/fi/")({
  component: FiUploaderPage,
});

interface UploadResult {
  success: boolean;
  id: string;
  url: string;
  directDownloadUrl: string;
  cdnDirectUrl?: string | null;
  filename: string;
  size: number;
  readableSize?: string;
  type?: string;
  error?: string;
}

interface HistoryItem {
  id: string;
  url: string;
  directDownloadUrl: string;
  filename: string;
  size: number;
  readableSize?: string;
  type: string;
  timestamp: number;
}

function getFileTypeIcon(type: string) {
  const t = type.toLowerCase();
  if (t.startsWith("image/")) return <ImageIcon className="size-5 text-cyan-400" />;
  if (t.startsWith("video/")) return <Video className="size-5 text-cyan-400" />;
  if (t.startsWith("audio/")) return <Music className="size-5 text-cyan-400" />;
  if (t.startsWith("text/") || t.includes("pdf") || t.includes("document") || t.includes("office") || t.includes("json")) return <FileText className="size-5 text-cyan-400" />;
  if (t.includes("zip") || t.includes("tar") || t.includes("rar") || t.includes("gzip") || t.includes("compressed")) return <Archive className="size-5 text-cyan-400" />;
  return <FileIcon className="size-5 text-cyan-400" />;
}

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function getRelativeTime(timestamp: number) {
  const diff = Date.now() - timestamp;
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return "Just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(timestamp).toLocaleDateString();
}

export function FiUploaderPage({ embed = false }: { embed?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedShare, setCopiedShare] = useState(false);
  const [copiedDirect, setCopiedDirect] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [expireOption, setExpireOption] = useState<number>(0); // 0 = Forever
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    if (embed) return;
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const initialTheme = savedTheme || "dark";
    setTheme(initialTheme);
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
  }, [embed]);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem("fi_upload_history");
      if (stored) setHistory(JSON.parse(stored));
    } catch (e) {
      console.error("Failed to load history", e);
    }
  }, []);

  const saveToHistory = (item: HistoryItem) => {
    setHistory((prev) => {
      const filtered = prev.filter((x) => x.id !== item.id);
      const updated = [item, ...filtered].slice(0, 50);
      localStorage.setItem("fi_upload_history", JSON.stringify(updated));
      return updated;
    });
  };

  const deleteFromHistory = (id: string) => {
    setHistory((prev) => {
      const updated = prev.filter((x) => x.id !== id);
      localStorage.setItem("fi_upload_history", JSON.stringify(updated));
      return updated;
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragging(true);
    } else if (e.type === "dragleave") {
      setDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      selectFile(e.dataTransfer.files[0]);
    }
  };

  const selectFile = (f: File) => {
    setError(null);
    setResult(null);
    setFile(f);
    setProgress(0);

    if (f.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target?.result as string);
      reader.readAsDataURL(f);
    } else {
      setPreviewUrl(null);
    }
  };

  const upload = async (f: File) => {
    setBusy(true);
    setError(null);
    setResult(null);
    setProgress(0);

    try {
      const uploadPromise = new Promise<UploadResult>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/fi/upload");

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100));
          }
        };

        xhr.onload = () => {
          try {
            const json = JSON.parse(xhr.responseText || "{}");
            if (xhr.status >= 200 && xhr.status < 300 && json.success) {
              resolve(json);
            } else {
              reject(new Error(json.error || `Upload failed (${xhr.status})`));
            }
          } catch {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error("Network error during upload"));

        const fd = new FormData();
        fd.append("file", f, f.name || "upload");
        fd.append("expire", String(expireOption));

        xhr.send(fd);
      });

      const data = await uploadPromise;

      const finalResult: UploadResult = {
        success: true,
        id: data.id,
        url: data.url,
        directDownloadUrl: data.directDownloadUrl,
        cdnDirectUrl: data.cdnDirectUrl,
        filename: data.filename || f.name,
        size: f.size,
        readableSize: data.readableSize || formatBytes(f.size),
        type: f.type,
      };

      setResult(finalResult);

      if (data.id) {
        saveToHistory({
          id: data.id,
          url: data.url,
          directDownloadUrl: data.directDownloadUrl,
          filename: data.filename || f.name,
          size: f.size,
          readableSize: data.readableSize || formatBytes(f.size),
          type: f.type || "file",
          timestamp: Date.now(),
        });
      }
    } catch (e: any) {
      setError(e.message || "Failed to upload file. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const copyShareLink = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  const copyDirectLink = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedDirect(true);
    setTimeout(() => setCopiedDirect(false), 2000);
  };

  const content = (
    <div className={`w-full max-w-4xl mx-auto space-y-8 text-left ${embed ? "py-2" : "px-4 py-8 sm:py-12"}`}>
      {/* Page Title Intro */}
      <div className="text-center md:text-left space-y-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-black tracking-wider uppercase">
          <Zap className="size-3.5" />
          <span>Fast File Vault & Direct CDN</span>
        </div>
        <h2 className="text-[34px] md:text-[44px] font-black tracking-tight leading-[1.1] select-none text-foreground">
          Cloud Drop.
          <br />
          <span className="opacity-40">Direct Streaming Links.</span>
        </h2>
        <p className="mt-2 text-[15px] text-muted-foreground max-w-lg">
          Upload any file up to 100MB and get instant direct download & streaming URLs on your own custom domain.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-start w-full">
        {/* Left: Upload Area */}
        <div className="md:col-span-3 space-y-4">
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`group border border-dashed rounded-[28px] p-8 sm:p-10 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[280px] relative overflow-hidden select-none shadow-2xl ${
              dragging
                ? "border-cyan-500 bg-cyan-500/10 scale-[1.02] shadow-cyan-500/20"
                : "border-cyan-500/30 hover:border-cyan-400/60 bg-secondary/15 hover:bg-secondary/30"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              onChange={(e) => e.target.files?.[0] && selectFile(e.target.files[0])}
              className="hidden"
            />

            {previewUrl ? (
              <div className="absolute inset-0 z-0 p-3">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover rounded-[22px] opacity-20 filter blur-[1px] group-hover:opacity-30 transition-opacity"
                />
              </div>
            ) : null}

            <div className="relative z-10 space-y-4 max-w-sm">
              <div className="size-16 rounded-[24px] bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-xl shadow-cyan-500/10">
                <Upload className="size-7" />
              </div>
              <div>
                <p className="text-[16px] font-black tracking-tight text-foreground">
                  {file ? file.name : "Select or Drop any file here"}
                </p>
                <p className="text-[12.5px] text-muted-foreground mt-1.5 flex items-center justify-center gap-1 font-medium">
                  {file ? (
                    <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 font-mono font-bold text-[11px]">
                      {formatBytes(file.size)} • {file.type || "unknown"}
                    </span>
                  ) : (
                    "High-speed uploads up to 100MB with direct domain links"
                  )}
                </p>
              </div>
            </div>
          </div>

          {file && (
            <div className="rounded-[28px] border border-cyan-500/25 bg-secondary/20 p-6 space-y-5 shadow-2xl backdrop-blur-xl animate-spring-scale select-none">
              <div className="space-y-2">
                <span className="text-[10.5px] font-black uppercase text-cyan-400 tracking-wider">Retention & Expiration</span>
                <div className="grid grid-cols-4 bg-background/80 border border-cyan-500/20 p-1 rounded-2xl gap-1">
                  <button
                    type="button"
                    onClick={() => setExpireOption(0)}
                    disabled={busy}
                    className={`py-2 rounded-xl text-[11px] font-black tracking-tight transition-all ${
                      expireOption === 0
                        ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/30"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Forever
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpireOption(86400)}
                    disabled={busy}
                    className={`py-2 rounded-xl text-[11px] font-black tracking-tight transition-all ${
                      expireOption === 86400
                        ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/30"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    24 Hours
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpireOption(43200)}
                    disabled={busy}
                    className={`py-2 rounded-xl text-[11px] font-black tracking-tight transition-all ${
                      expireOption === 43200
                        ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/30"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    12 Hours
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpireOption(3600)}
                    disabled={busy}
                    className={`py-2 rounded-xl text-[11px] font-black tracking-tight transition-all ${
                      expireOption === 3600
                        ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/30"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    1 Hour
                  </button>
                </div>
              </div>

              {busy && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono font-bold text-cyan-300">
                    <span>Uploading & Resolving Direct Stream...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-secondary overflow-hidden border border-cyan-500/20">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => upload(file)}
                disabled={busy}
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-xl shadow-cyan-600/20 active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2"
              >
                <Zap className="size-4" />
                <span>{busy ? `Uploading (${progress}%)...` : "Upload & Generate Direct Link"}</span>
              </button>
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-[12.5px] font-bold p-4 text-center select-none animate-shiver">
              {error}
            </div>
          )}

          {result && result.success && (
            <div className="rounded-[28px] border border-cyan-500/30 p-6 bg-cyan-500/5 backdrop-blur-xl space-y-5 shadow-2xl animate-spring-scale">
              <div className="text-center space-y-1">
                <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono font-black text-[10px] uppercase tracking-widest">
                  ✓ Direct Link Ready
                </span>
                <h4 className="text-[15px] font-black truncate text-foreground pt-1">{result.filename}</h4>
                <p className="text-[11px] text-muted-foreground font-mono">{result.readableSize}</p>
              </div>

              {/* Link 1: Direct Download URL */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10.5px] font-black uppercase text-cyan-400 tracking-wider flex items-center gap-1.5">
                    <Download className="size-3.5" />
                    <span>Direct Download URL (Instant Stream)</span>
                  </label>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold">Direct File Link</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={result.directDownloadUrl}
                    className="flex-1 h-11 bg-background border border-cyan-500/30 rounded-2xl px-4 text-xs font-mono font-bold text-foreground outline-none min-w-0"
                  />
                  <button
                    type="button"
                    onClick={() => copyDirectLink(result.directDownloadUrl)}
                    className="h-11 px-4 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-black text-xs transition-all shadow-lg shadow-cyan-600/20 flex items-center gap-1.5 flex-shrink-0 active:scale-95"
                  >
                    {copiedDirect ? <Check className="size-4" /> : <Copy className="size-4" />}
                    <span className="hidden sm:inline">{copiedDirect ? "Copied" : "Copy Direct"}</span>
                  </button>
                  <a
                    href={result.directDownloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-11 px-3.5 rounded-2xl bg-secondary hover:bg-secondary/80 text-foreground flex items-center justify-center flex-shrink-0 transition-all border border-border"
                    title="Open Direct Download"
                  >
                    <ExternalLink className="size-4" />
                  </a>
                </div>
              </div>

              {/* Link 2: Viewer / Landing Page */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10.5px] font-black uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                    <Share2 className="size-3.5" />
                    <span>File Viewer Page</span>
                  </label>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={result.url}
                    className="flex-1 h-11 bg-background border border-border/50 rounded-2xl px-4 text-xs font-mono font-bold text-foreground outline-none min-w-0"
                  />
                  <button
                    type="button"
                    onClick={() => copyShareLink(result.url)}
                    className="h-11 px-4 rounded-2xl bg-secondary hover:bg-secondary/80 text-foreground font-black text-xs transition-all border border-border flex items-center gap-1.5 flex-shrink-0 active:scale-95"
                  >
                    {copiedShare ? <Check className="size-4" /> : <Copy className="size-4" />}
                    <span className="hidden sm:inline">{copiedShare ? "Copied" : "Copy Page"}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: History */}
        <div className="md:col-span-2 space-y-4">
          <div className="space-y-4">
            <h3 className="text-[17px] font-black tracking-tight border-b border-border/30 pb-2.5 flex items-center gap-2 select-none text-muted-foreground">
              <Clock className="size-4.5" />
              <span>Vault History</span>
            </h3>

            {history.length > 0 ? (
              <div className="grid gap-2 max-h-[380px] overflow-y-auto pr-1">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3.5 rounded-[18px] border border-border/40 bg-secondary/5 hover:border-cyan-500/30 transition-all select-none group"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1 pr-3">
                      <div className="size-9 rounded-[12px] bg-secondary border border-border flex items-center justify-center flex-shrink-0">
                        {getFileTypeIcon(item.type)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold truncate text-foreground">{item.filename}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">
                          {item.readableSize || formatBytes(item.size)} • {getRelativeTime(item.timestamp)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <a 
                        href={item.directDownloadUrl || item.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="size-8 rounded-full hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-cyan-400"
                        title="Download"
                      >
                        <Download className="size-3.5" />
                      </a>
                      <button 
                        type="button"
                        onClick={() => deleteFromHistory(item.id)} 
                        className="size-8 rounded-full hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-red-500"
                        title="Delete from history"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-dashed border-border/40 rounded-[24px] p-8 text-center text-muted-foreground/70 select-none">
                <HardDrive className="size-8 mx-auto mb-3 opacity-40" />
                <p className="text-[14px] font-semibold">Vault is empty</p>
                <p className="text-[12px] mt-1 text-muted-foreground/50">Files you drop here will appear in your history.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (embed) return content;

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-300 relative">
      <header className="px-4 sm:px-6 py-4 sm:py-6 flex items-center justify-between max-w-2xl md:max-w-6xl mx-auto w-full border-b border-border/40 backdrop-blur-md sticky top-0 z-40 bg-background/80">
        <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto">
          <Link to="/" className="text-[16px] sm:text-[20px] font-black tracking-tighter select-none flex-shrink-0">
            CLOUD
          </Link>
          <Link to="/fi" className="text-[16px] sm:text-[20px] font-black tracking-tighter select-none text-cyan-400 flex-shrink-0">
            DROP
          </Link>
          <Link to="/main" className="text-[16px] sm:text-[20px] font-black tracking-tighter select-none opacity-40 hover:opacity-100 transition-opacity flex-shrink-0">
            STORAGE
          </Link>
          <Link to="/links" className="text-[16px] sm:text-[20px] font-black tracking-tighter select-none opacity-40 hover:opacity-100 transition-opacity flex-shrink-0">
            LINKS
          </Link>
          <Link to="/note" className="text-[16px] sm:text-[20px] font-black tracking-tighter select-none opacity-40 hover:opacity-100 transition-opacity flex-shrink-0">
            NOTES
          </Link>
        </div>

        <button 
          onClick={toggleTheme}
          className="size-10 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-all active:scale-90 flex-shrink-0 ml-3"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </button>
      </header>

      {content}
    </main>
  );
}
