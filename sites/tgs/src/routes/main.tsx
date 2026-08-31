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
  Image as ImageIcon
} from "lucide-react";
import { ASCLOUD_HOSTING_URL } from "../lib/constants";

export const Route = createFileRoute("/main")({
  component: FileCloudPage,
});

interface UploadResult {
  success: boolean;
  url: string;
  filename: string;
  size: number;
  type: string;
  error?: string;
}

interface HistoryItem {
  url: string;
  filename: string;
  size: number;
  type: string;
  timestamp: number;
}

function getFileTypeIcon(type: string) {
  const t = type.toLowerCase();
  if (t.startsWith("image/")) return <ImageIcon className="size-5 text-purple-400" />;
  if (t.startsWith("video/")) return <Video className="size-5 text-purple-400" />;
  if (t.startsWith("audio/")) return <Music className="size-5 text-purple-400" />;
  if (t.startsWith("text/") || t.includes("pdf") || t.includes("document") || t.includes("office")) return <FileText className="size-5 text-purple-400" />;
  if (t.includes("zip") || t.includes("tar") || t.includes("rar") || t.includes("gzip") || t.includes("compressed")) return <Archive className="size-5 text-purple-400" />;
  return <FileIcon className="size-5 text-purple-400" />;
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

export function FileCloudPage({ embed = false }: { embed?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedMirror, setCopiedMirror] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [retention, setRetention] = useState<"permanent" | "72h">("permanent");
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
      const stored = localStorage.getItem("cloud_upload_history");
      if (stored) setHistory(JSON.parse(stored));
    } catch (e) {
      console.error("Failed to load history", e);
    }
  }, []);

  const saveToHistory = (item: HistoryItem) => {
    setHistory((prev) => {
      const filtered = prev.filter((x) => x.url !== item.url);
      const updated = [item, ...filtered].slice(0, 50); // limit to 50
      localStorage.setItem("cloud_upload_history", JSON.stringify(updated));
      return updated;
    });
  };

  const deleteFromHistory = (url: string) => {
    setHistory((prev) => {
      const updated = prev.filter((x) => x.url !== url);
      localStorage.setItem("cloud_upload_history", JSON.stringify(updated));
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

  // Direct Catbox Upload (Permanent, Client-to-Edge)
  const uploadDirectCatbox = (fileToUpload: File): Promise<UploadResult> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "https://catbox.moe/user/api.php");

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        const text = (xhr.responseText || "").trim();
        if (xhr.status >= 200 && xhr.status < 300 && text.startsWith("http")) {
          const name = text.split("/").pop();
          const maskedUrl = `${window.location.origin}/${name}`;
          resolve({
            success: true,
            url: maskedUrl,
            filename: name || fileToUpload.name,
            size: fileToUpload.size,
            type: fileToUpload.type,
          });
        } else {
          reject(new Error(text || `Catbox upload failed (${xhr.status})`));
        }
      };

      xhr.onerror = () => reject(new Error("Catbox network error"));

      const fd = new FormData();
      fd.append("reqtype", "fileupload");
      fd.append("fileToUpload", fileToUpload, fileToUpload.name || "upload");

      xhr.send(fd);
    });
  };

  // Direct Tmpfiles Upload (Permanent / Long-term)
  const uploadDirectTmpfiles = (fileToUpload: File): Promise<UploadResult> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "https://tmpfiles.org/api/v1/upload");

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        try {
          const json = JSON.parse(xhr.responseText || "{}");
          if (xhr.status >= 200 && xhr.status < 300 && json.status === "success") {
            const rawUrl = json.data.url;
            const finalUrl = rawUrl.replace("tmpfiles.org/", "tmpfiles.org/dl/");
            const name = finalUrl.split("/").pop() || fileToUpload.name;
            const maskedUrl = `${window.location.origin}/${name}`;
            resolve({
              success: true,
              url: maskedUrl,
              filename: fileToUpload.name,
              size: fileToUpload.size,
              type: fileToUpload.type,
            });
          } else {
            reject(new Error(json.error || `Tmpfiles upload failed (${xhr.status})`));
          }
        } catch {
          reject(new Error(`Tmpfiles parse error`));
        }
      };

      xhr.onerror = () => reject(new Error("Tmpfiles network error"));

      const fd = new FormData();
      fd.append("file", fileToUpload, fileToUpload.name || "upload");

      xhr.send(fd);
    });
  };

  // Direct Pixeldrain Upload
  const uploadDirectPixeldrain = (fileToUpload: File): Promise<UploadResult> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const safeName = encodeURIComponent(fileToUpload.name || "file");
      xhr.open("PUT", `https://pixeldrain.com/api/file/${safeName}`);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        try {
          const json = JSON.parse(xhr.responseText || "{}");
          if (xhr.status >= 200 && xhr.status < 300 && json.success && json.id) {
            const rawUrl = `https://pixeldrain.com/api/file/${json.id}`;
            resolve({
              success: true,
              url: rawUrl,
              filename: fileToUpload.name,
              size: fileToUpload.size,
              type: fileToUpload.type,
            });
          } else {
            reject(new Error(json.message || `Pixeldrain upload failed (${xhr.status})`));
          }
        } catch {
          reject(new Error("Pixeldrain parse error"));
        }
      };

      xhr.onerror = () => reject(new Error("Pixeldrain network error"));
      xhr.send(fileToUpload);
    });
  };

  // Direct Uguu.se Upload
  const uploadDirectUguu = (fileToUpload: File): Promise<UploadResult> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "https://uguu.se/upload.php");

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        try {
          const json = JSON.parse(xhr.responseText || "{}");
          if (xhr.status >= 200 && xhr.status < 300 && json.success && json.files?.[0]?.url) {
            const uUrl = json.files[0].url;
            const name = uUrl.split("/").pop() || fileToUpload.name;
            const maskedUrl = `${window.location.origin}/${name}`;
            resolve({
              success: true,
              url: maskedUrl,
              filename: fileToUpload.name,
              size: fileToUpload.size,
              type: fileToUpload.type,
            });
          } else {
            reject(new Error("Uguu upload failed"));
          }
        } catch {
          reject(new Error("Uguu parse error"));
        }
      };

      xhr.onerror = () => reject(new Error("Uguu network error"));

      const fd = new FormData();
      fd.append("files[]", fileToUpload, fileToUpload.name || "upload");
      xhr.send(fd);
    });
  };

  // Direct Litterbox Upload (72h temporary)
  const uploadDirectLitterbox = (fileToUpload: File): Promise<UploadResult> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "https://litterbox.catbox.moe/resources/internals/api.php");

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        const text = (xhr.responseText || "").trim();
        if (xhr.status >= 200 && xhr.status < 300 && text.startsWith("http")) {
          const name = text.split("/").pop();
          const maskedUrl = `${window.location.origin}/${name}`;
          resolve({
            success: true,
            url: maskedUrl,
            filename: fileToUpload.name,
            size: fileToUpload.size,
            type: fileToUpload.type,
          });
        } else {
          reject(new Error(text || `Litterbox upload failed (${xhr.status})`));
        }
      };

      xhr.onerror = () => reject(new Error("Litterbox network error"));

      const fd = new FormData();
      fd.append("reqtype", "fileupload");
      fd.append("time", "72h");
      fd.append("fileToUpload", fileToUpload, fileToUpload.name || "upload");

      xhr.send(fd);
    });
  };

  // Serverless Proxy Fallback
  const uploadViaProxy = (fileToUpload: File): Promise<UploadResult> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/public/upload");

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
          const respText = xhr.responseText || "";
          if (xhr.status === 413 || respText.includes("Too Large") || respText.includes("Request Entity Too Large")) {
            reject(new Error("File is too large for server proxy. Trying direct upload..."));
          } else {
            reject(new Error(`Upload failed (${xhr.status})`));
          }
        }
      };

      xhr.onerror = () => reject(new Error("Network error"));

      const fd = new FormData();
      fd.append("file", fileToUpload, fileToUpload.name || "upload");
      fd.append("retention", retention);

      xhr.send(fd);
    });
  };

  const upload = async (f: File) => {
    setBusy(true);
    setError(null);
    setResult(null);
    setProgress(0);

    try {
      let data: UploadResult;

      if (retention === "permanent") {
        // Multi-tier fallback for permanent upload:
        try {
          // 1. Direct Catbox (Permanent)
          data = await uploadDirectCatbox(f);
        } catch (e1) {
          console.warn("Direct Catbox upload failed, trying Tmpfiles:", e1);
          try {
            // 2. Direct Tmpfiles (Permanent / Long-term)
            data = await uploadDirectTmpfiles(f);
          } catch (e2) {
            console.warn("Direct Tmpfiles failed, trying server proxy:", e2);
            try {
              // 3. Serverless Proxy upload
              data = await uploadViaProxy(f);
            } catch (e3) {
              console.warn("Server proxy failed, trying Pixeldrain:", e3);
              try {
                // 4. Pixeldrain Direct
                data = await uploadDirectPixeldrain(f);
              } catch (e4) {
                // 5. Uguu Direct
                data = await uploadDirectUguu(f);
              }
            }
          }
        }
      } else {
        // Temporary 72h storage
        try {
          data = await uploadDirectLitterbox(f);
        } catch {
          try {
            data = await uploadDirectTmpfiles(f);
          } catch {
            try {
              data = await uploadDirectCatbox(f);
            } catch {
              data = await uploadViaProxy(f);
            }
          }
        }
      }

      const finalResult: UploadResult = {
        success: true,
        url: data.url,
        filename: data.filename || f.name,
        size: f.size,
        type: f.type,
      };

      setResult(finalResult);

      if (data.url) {
        saveToHistory({
          url: data.url,
          filename: data.filename || f.name,
          size: f.size,
          type: f.type,
          timestamp: Date.now(),
        });
      }
    } catch (e) {
      setError((e as Error).message || "Upload failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const copyLink = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyMirrorLink = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedMirror(true);
    setTimeout(() => setCopiedMirror(false), 2000);
  };

  const getMirrorUrl = (url: string) => {
    if (!url || !url.includes("catbox.moe")) return null;
    const key = url.split("/").pop();
    if (!key) return null;
    return `https://cloud.svro.workers.dev/${key}`;
  };

  const content = (
    <div className={`w-full max-w-4xl mx-auto space-y-8 text-left ${embed ? "py-2" : "px-4 py-8 sm:py-12"}`}>
      
      {/* Page Title Intro */}
      <div className="text-center md:text-left">
        <h2 className="text-[34px] md:text-[44px] font-black tracking-tight leading-[1.1] select-none">
          File Cloud.
          <br />
          <span className="opacity-40">Permanent & Temporary.</span>
        </h2>
        <p className="mt-2 text-[15px] text-muted-foreground max-w-md">
          Secure, anonymous uploads with direct links. Permanent nodes are served from CDN edges globally.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-start w-full">
        {/* Left: Drag Drop Area */}
        <div className="md:col-span-3 space-y-4">
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`group border border-dashed rounded-[28px] p-8 sm:p-10 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[280px] relative overflow-hidden select-none shadow-2xl ${
              dragging
                ? "border-purple-500 bg-purple-500/10 scale-[1.02] shadow-purple-500/20"
                : "border-purple-500/30 hover:border-purple-400/60 bg-secondary/15 hover:bg-secondary/30"
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
              <div className="size-16 rounded-[24px] bg-gradient-to-tr from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center mx-auto text-purple-400 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-xl shadow-purple-500/10">
                <Upload className="size-7" />
              </div>
              <div>
                <p className="text-[16px] font-black tracking-tight text-foreground">
                  {file ? file.name : "Select or Drop any file here"}
                </p>
                <p className="text-[12.5px] text-muted-foreground mt-1.5 flex items-center justify-center gap-1 font-medium">
                  {file ? (
                    <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 font-mono font-bold text-[11px]">
                      {formatBytes(file.size)} • {file.type || "unknown"}
                    </span>
                  ) : (
                    "Upload documents, images, audio, video, zip files up to 100MB"
                  )}
                </p>
              </div>
            </div>
          </div>

          {file && (
            <div className="rounded-[28px] border border-purple-500/25 bg-secondary/20 p-6 space-y-5 shadow-2xl backdrop-blur-xl animate-spring-scale select-none">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-purple-400 tracking-wider">Storage Node Config</span>
                  <div className="flex bg-background/80 border border-purple-500/20 p-1 rounded-2xl mt-1.5 gap-1">
                    <button
                      onClick={() => setRetention("permanent")}
                      disabled={busy}
                      className={`px-4 py-2 rounded-xl text-[12px] font-black tracking-tight transition-all ${
                        retention === "permanent"
                          ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Permanent (AS CLOUD Storage)
                    </button>
                    <button
                      onClick={() => setRetention("72h")}
                      disabled={busy}
                      className={`px-4 py-2 rounded-xl text-[12px] font-black tracking-tight transition-all ${
                        retention === "72h"
                          ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Temporary (72h)
                    </button>
                  </div>
                </div>
              </div>

              {busy && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono font-bold text-purple-300">
                    <span>Uploading to CDN...</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-secondary overflow-hidden border border-purple-500/20">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-emerald-400 transition-all duration-300 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                onClick={() => upload(file)}
                disabled={busy}
                className="w-full h-12 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider transition-all shadow-xl shadow-purple-600/20 active:scale-95 disabled:opacity-40"
              >
                {busy ? `Uploading (${progress}%)...` : "Upload File Now"}
              </button>
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-[12.5px] font-bold p-4 text-center select-none animate-shiver">
              {error}
            </div>
          )}

          {result && result.success && (
            <div className="rounded-[28px] border border-emerald-500/30 p-6 bg-emerald-500/5 backdrop-blur-xl space-y-5 shadow-2xl animate-spring-scale">
              <div className="text-center space-y-1">
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-black text-[10px] uppercase tracking-widest">
                  ✓ Upload Completed
                </span>
                <h4 className="text-[15px] font-black truncate text-foreground pt-1">{result.filename}</h4>
              </div>

              {/* Link 1: Primary */}
              <div className="space-y-1.5">
                <label className="text-[10.5px] font-black uppercase text-muted-foreground tracking-wider">Direct CDN Link</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={result.url}
                    className="flex-1 h-11 bg-background border border-border/50 rounded-2xl px-4 text-xs font-mono font-bold text-foreground outline-none min-w-0"
                  />
                  <button
                    onClick={() => copyLink(result.url)}
                    className="h-11 px-4 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs transition-all shadow-lg shadow-purple-600/20 flex items-center gap-1.5 flex-shrink-0 active:scale-95"
                  >
                    {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                    <span className="hidden sm:inline">{copied ? "Copied" : "Copy Link"}</span>
                  </button>
                </div>
              </div>

              {/* Link 2: Mirror */}
              {retention === "permanent" && getMirrorUrl(result.url) && (
                <div className="space-y-1.5">
                  <label className="text-[10.5px] font-black uppercase text-purple-400 tracking-wider">Worker Mirror Link</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={getMirrorUrl(result.url)!}
                      className="flex-1 h-11 bg-background border border-purple-500/30 rounded-2xl px-4 text-xs font-mono font-bold text-foreground outline-none min-w-0"
                    />
                    <button
                      onClick={() => copyMirrorLink(getMirrorUrl(result.url)!)}
                      className="h-11 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-1.5 flex-shrink-0 active:scale-95"
                    >
                      {copiedMirror ? <Check className="size-4" /> : <Copy className="size-4" />}
                      <span className="hidden sm:inline">{copiedMirror ? "Copied" : "Copy Mirror"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: History */}
        <div className="md:col-span-2 space-y-4">
          <div className="space-y-4">
            <h3 className="text-[17px] font-black tracking-tight border-b border-border/30 pb-2.5 flex items-center gap-2 select-none text-muted-foreground">
              <Clock className="size-4.5" />
              <span>Upload History</span>
            </h3>

            {history.length > 0 ? (
              <div className="grid gap-2 max-h-[380px] overflow-y-auto pr-1">
                {history.map((item) => (
                  <div
                    key={item.url}
                    className="flex items-center justify-between p-3.5 rounded-[18px] border border-border/40 bg-secondary/5 hover:border-foreground/30 transition-all select-none"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1 pr-3">
                      <div className="size-9 rounded-[12px] bg-secondary border border-border flex items-center justify-center flex-shrink-0">
                        {getFileTypeIcon(item.type)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold truncate text-foreground">{item.filename}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {formatBytes(item.size)} • {getRelativeTime(item.timestamp)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="size-8 rounded-full hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground">
                        <ExternalLink className="size-3.5" />
                      </a>
                      <button onClick={() => deleteFromHistory(item.url)} className="size-8 rounded-full hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-red-500">
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-dashed border-border/40 rounded-[24px] p-8 text-center text-muted-foreground/70 select-none">
                <HardDrive className="size-8 mx-auto mb-3 opacity-40" />
                <p className="text-[14px] font-semibold">Workspace is clean</p>
                <p className="text-[12px] mt-1 text-muted-foreground/50">Your uploaded files will appear here on this device.</p>
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
          <Link to="/main" className="text-[16px] sm:text-[20px] font-black tracking-tighter select-none flex-shrink-0">
            CLOUD
          </Link>
          <Link to="/note" className="text-[16px] sm:text-[20px] font-black tracking-tighter select-none opacity-40 hover:opacity-100 transition-opacity flex-shrink-0">
            NOTES
          </Link>
          <Link to="/convert" className="text-[16px] sm:text-[20px] font-black tracking-tighter select-none opacity-40 hover:opacity-100 transition-opacity flex-shrink-0">
            CONVERTS
          </Link>
          <Link to="/owner" className="text-[16px] sm:text-[20px] font-black tracking-tighter select-none opacity-40 hover:opacity-100 transition-opacity flex-shrink-0">
            ABOUT
          </Link>
          <a 
            href={ASCLOUD_HOSTING_URL} 
            target="_blank"
            rel="noopener noreferrer"
            className="text-[16px] sm:text-[20px] font-black tracking-tighter select-none opacity-80 hover:opacity-100 transition-opacity flex-shrink-0 text-amber-400 flex items-center gap-1"
            title="AS Cloud Hosting Subsite"
          >
            <span>HOSTING</span>
            <span className="text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300">
              DEV
            </span>
          </a>
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
