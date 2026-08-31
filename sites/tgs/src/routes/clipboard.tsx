import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import {
  Smartphone,
  Send,
  Download,
  Copy,
  Check,
  ArrowLeft,
  Loader2,
  FileText,
  Image as ImageIcon,
  Film,
  Music,
  File,
  Upload,
  RefreshCw,
  Share2,
  Lock,
  Sparkles,
  ExternalLink,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { CrossDeviceItem } from "../lib/github-crossdevice";

function CrossDeviceClipboardPage() {
  const [activeTab, setActiveTab] = useState<"send" | "receive">("send");

  // Send state
  const [sendText, setSendText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sendLoading, setSendLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [sendError, setSendError] = useState("");

  // Receive state
  const [receiveCode, setReceiveCode] = useState("");
  const [receiveLoading, setReceiveLoading] = useState(false);
  const [receivedItem, setReceivedItem] = useState<CrossDeviceItem | null>(null);
  const [receiveError, setReceiveError] = useState("");
  const [copiedText, setCopiedText] = useState(false);

  // Recent History
  const [history, setHistory] = useState<Array<{ code: string; type: string; title: string; date: string }>>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Read URL query params e.g. /clipboard?code=8492015
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const queryCode = urlParams.get("code");
      if (queryCode && queryCode.replace(/\D/g, "").length === 7) {
        setReceiveCode(queryCode.replace(/\D/g, ""));
        setActiveTab("receive");
        fetchReceivedItem(queryCode.replace(/\D/g, ""));
      }
    } catch {}

    // Load local history
    try {
      const saved = localStorage.getItem("crossdevice_history");
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch {}
  }, []);

  const saveToLocalHistory = (entry: { code: string; type: string; title: string; date: string }) => {
    try {
      const updated = [entry, ...history.filter((h) => h.code !== entry.code)].slice(0, 10);
      setHistory(updated);
      localStorage.setItem("crossdevice_history", JSON.stringify(updated));
    } catch {}
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendError("");
    if (!sendText.trim() && !selectedFile) {
      setSendError("Please enter text or upload a media file.");
      return;
    }

    setSendLoading(true);
    try {
      const formData = new FormData();
      if (sendText.trim()) formData.append("text", sendText.trim());
      if (selectedFile) formData.append("file", selectedFile);

      const res = await fetch("/api/crossdevice/send", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to send data.");
      }

      setGeneratedCode(data.code);
      saveToLocalHistory({
        code: data.code,
        type: data.item.type,
        title: selectedFile ? selectedFile.name : sendText.slice(0, 30),
        date: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      });
    } catch (err: any) {
      setSendError(err.message || "Upload failed.");
    } finally {
      setSendLoading(false);
    }
  };

  const fetchReceivedItem = async (codeToFetch: string) => {
    const clean = codeToFetch.trim().replace(/\D/g, "");
    if (clean.length !== 7) {
      setReceiveError("Code must be exactly 7 digits.");
      return;
    }

    setReceiveLoading(true);
    setReceiveError("");
    setReceivedItem(null);

    try {
      const res = await fetch(`/api/crossdevice/receive?code=${clean}`);
      const data = await res.json();

      if (!res.ok || !data.success || !data.item) {
        throw new Error(data.error || "No item found for this code.");
      }

      setReceivedItem(data.item);
      saveToLocalHistory({
        code: data.item.code,
        type: data.item.type,
        title: data.item.fileName || (data.item.text ? data.item.text.slice(0, 30) : "Received Data"),
        date: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      });
    } catch (err: any) {
      setReceiveError(err.message || "Failed to retrieve data.");
    } finally {
      setReceiveLoading(false);
    }
  };

  const handleReceiveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReceivedItem(receiveCode);
  };

  const handleCopy = (text: string, type: "code" | "text") => {
    navigator.clipboard.writeText(text);
    if (type === "code") {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    }
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getFileIcon = (mime?: string, name?: string) => {
    const ext = name?.split(".").pop()?.toLowerCase() || "";
    if (mime?.startsWith("image") || ["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) {
      return <ImageIcon className="size-5 text-sky-400" />;
    }
    if (mime?.startsWith("video") || ["mp4", "webm", "mkv", "mov"].includes(ext)) {
      return <Film className="size-5 text-purple-400" />;
    }
    if (mime?.startsWith("audio") || ["mp3", "wav", "m4a", "ogg"].includes(ext)) {
      return <Music className="size-5 text-emerald-400" />;
    }
    return <File className="size-5 text-amber-400" />;
  };

  return (
    <main className="min-h-screen bg-[#000000] text-foreground font-sans relative selection:bg-white/20 pb-20">
      {/* iOS Translucent Sticky Header */}
      <header className="px-4 sm:px-6 md:px-8 py-4 border-b border-zinc-800/80 sticky top-0 z-40 bg-[#000000]/90 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
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
                  <Smartphone className="size-4" />
                </span>
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">
                  Cross-Device Clipboard
                </h1>
              </div>
            </div>
          </div>

          <span className="px-2.5 py-1 rounded-full bg-zinc-900 text-sky-400 border border-zinc-800 text-[10px] font-mono font-bold tracking-wider">
            7-DIGIT SYNC
          </span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* iOS Segmented Control Tabs */}
        <div className="p-1 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 grid grid-cols-2 gap-1 backdrop-blur-md">
          <button
            onClick={() => setActiveTab("send")}
            className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-95 ${
              activeTab === "send"
                ? "bg-white text-black shadow-lg shadow-white/10"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Send className="size-3.5" />
            <span>Send / Share</span>
          </button>

          <button
            onClick={() => setActiveTab("receive")}
            className={`py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 active:scale-95 ${
              activeTab === "receive"
                ? "bg-white text-black shadow-lg shadow-white/10"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Download className="size-3.5" />
            <span>Receive / Fetch</span>
          </button>
        </div>

        {/* SEND TAB CONTENT */}
        {activeTab === "send" && (
          <div className="space-y-6">
            <form onSubmit={handleSend} className="p-6 rounded-3xl border border-zinc-800/80 bg-[#09090b] space-y-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3.5">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Sparkles className="size-4 text-sky-400" />
                  New Transfer Payload
                </span>
                <span className="text-[11px] font-mono text-zinc-500">Unlimited Size</span>
              </div>

              {sendError && (
                <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono">
                  {sendError}
                </div>
              )}

              {/* Text Area */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                  <span>Text / Caption Payload:</span>
                  <span>{sendText.length} characters</span>
                </div>
                <textarea
                  rows={4}
                  value={sendText}
                  onChange={(e) => setSendText(e.target.value)}
                  placeholder="Paste or type text, links, code, or captions here (no size limit)..."
                  className="w-full p-4 rounded-2xl bg-[#000000] border border-zinc-800 text-xs font-mono text-white placeholder:text-zinc-600 outline-none focus:border-zinc-600 leading-relaxed resize-y"
                />
              </div>

              {/* File Upload Selector */}
              <div className="space-y-2">
                <span className="text-[11px] font-mono text-zinc-400">Optional Media File Attachment:</span>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFile(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />

                {selectedFile ? (
                  <div className="p-3.5 rounded-2xl bg-[#000000] border border-zinc-800 flex items-center justify-between">
                    <div className="flex items-center gap-3 truncate">
                      {getFileIcon(selectedFile.type, selectedFile.name)}
                      <div className="truncate">
                        <div className="text-xs font-bold text-white truncate">{selectedFile.name}</div>
                        <div className="text-[10px] font-mono text-zinc-500">{formatBytes(selectedFile.size)}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedFile(null)}
                      className="p-1.5 rounded-xl hover:bg-zinc-800 text-zinc-500 hover:text-red-400 transition-all"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-5 px-4 rounded-2xl border border-dashed border-zinc-800 hover:border-zinc-700 bg-[#000000]/50 hover:bg-[#000000] text-zinc-400 hover:text-white text-xs font-mono transition-all flex flex-col items-center justify-center gap-2 group"
                  >
                    <Upload className="size-5 text-zinc-500 group-hover:text-sky-400 transition-colors" />
                    <span>Click to attach photo, video, audio, or document</span>
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={sendLoading || (!sendText.trim() && !selectedFile)}
                className="w-full h-12 rounded-2xl bg-white hover:bg-zinc-200 text-black font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-40 shadow-lg"
              >
                {sendLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Processing & Uploading...</span>
                  </>
                ) : (
                  <>
                    <Send className="size-4" />
                    <span>Generate Transfer Code</span>
                  </>
                )}
              </button>
            </form>

            {/* GENERATED 7-DIGIT CODE DISPLAY CARD */}
            {generatedCode && (
              <div className="p-6 sm:p-7 rounded-3xl border border-emerald-500/30 bg-emerald-500/5 space-y-4 text-center animate-spring-scale shadow-2xl">
                <div className="flex items-center justify-center gap-2 text-emerald-400 text-xs font-mono font-bold">
                  <CheckCircle2 className="size-4" />
                  <span>PAYLOAD STORED SUCCESSFULLY</span>
                </div>

                <div className="space-y-1">
                  <div className="text-[11px] font-mono text-zinc-400 uppercase">Your 7-Digit Transfer Code:</div>
                  <div className="text-3xl sm:text-4xl font-black text-white font-mono tracking-[0.35em] py-2">
                    {generatedCode.slice(0, 3)} {generatedCode.slice(3)}
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    onClick={() => handleCopy(generatedCode, "code")}
                    className="h-11 px-6 rounded-2xl bg-white hover:bg-zinc-200 text-black font-bold text-xs uppercase tracking-wide transition-all flex items-center justify-center gap-2 active:scale-95 shadow-md"
                  >
                    {copiedCode ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
                    <span>{copiedCode ? "Copied Code" : "Copy Code"}</span>
                  </button>

                  <button
                    onClick={() => {
                      const shareUrl = `${window.location.origin}/clipboard?code=${generatedCode}`;
                      navigator.clipboard.writeText(shareUrl);
                      alert("Share link copied to clipboard!");
                    }}
                    className="h-11 px-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-bold text-xs transition-all flex items-center justify-center gap-2"
                  >
                    <Share2 className="size-4" />
                    <span>Share Link</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* RECEIVE TAB CONTENT */}
        {activeTab === "receive" && (
          <div className="space-y-6">
            <form onSubmit={handleReceiveSubmit} className="p-6 rounded-3xl border border-zinc-800/80 bg-[#09090b] space-y-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3.5">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Download className="size-4 text-sky-400" />
                  Fetch Payload by Code
                </span>
                <span className="text-[11px] font-mono text-zinc-500">7-Digit Key</span>
              </div>

              {receiveError && (
                <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono">
                  {receiveError}
                </div>
              )}

              <div className="space-y-2 text-center">
                <label className="text-[11px] font-mono text-zinc-400 uppercase">Enter 7-Digit Transfer Code:</label>
                <input
                  type="text"
                  maxLength={7}
                  value={receiveCode}
                  onChange={(e) => setReceiveCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="e.g. 8492015"
                  className="w-full h-14 text-center text-2xl font-black font-mono tracking-[0.3em] rounded-2xl bg-[#000000] border border-zinc-800 text-white placeholder:text-zinc-700 outline-none focus:border-sky-500 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={receiveLoading || receiveCode.length !== 7}
                className="w-full h-12 rounded-2xl bg-white hover:bg-zinc-200 text-black font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-40 shadow-lg"
              >
                {receiveLoading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Searching Database...</span>
                  </>
                ) : (
                  <>
                    <Download className="size-4" />
                    <span>Fetch Payload</span>
                  </>
                )}
              </button>
            </form>

            {/* RECEIVED ITEM DISPLAY CARD */}
            {receivedItem && (
              <div className="p-6 sm:p-7 rounded-3xl border border-zinc-800 bg-[#09090b] space-y-5 shadow-2xl animate-spring-scale">
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[10px] font-mono font-bold uppercase">
                      Code: {receivedItem.code}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">
                      {new Date(receivedItem.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  <span className="text-[10px] font-mono text-zinc-400 uppercase">
                    Type: {receivedItem.type}
                  </span>
                </div>

                {/* Text Content */}
                {receivedItem.text && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                      <span>Text / Caption:</span>
                      <button
                        onClick={() => handleCopy(receivedItem.text || "", "text")}
                        className="hover:text-white flex items-center gap-1 font-bold text-sky-400"
                      >
                        {copiedText ? <Check className="size-3" /> : <Copy className="size-3" />}
                        <span>{copiedText ? "Copied" : "Copy Text"}</span>
                      </button>
                    </div>

                    <pre className="p-4 rounded-2xl bg-[#000000] border border-zinc-800 font-mono text-xs text-zinc-200 whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">
                      {receivedItem.text}
                    </pre>
                  </div>
                )}

                {/* Media Attachment */}
                {receivedItem.mediaUrl && (
                  <div className="space-y-3 pt-1">
                    <span className="text-[11px] font-mono text-zinc-400">Media Attachment:</span>

                    {/* Media Preview if Image/Video */}
                    {receivedItem.mimeType?.startsWith("image") || receivedItem.mediaUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                      <img
                        src={receivedItem.mediaUrl}
                        alt="Shared Media"
                        className="w-full max-h-80 object-contain rounded-2xl bg-black border border-zinc-800"
                      />
                    ) : receivedItem.mimeType?.startsWith("video") || receivedItem.mediaUrl.match(/\.(mp4|webm|mov)$/i) ? (
                      <video
                        controls
                        src={receivedItem.mediaUrl}
                        className="w-full max-h-80 rounded-2xl bg-black border border-zinc-800"
                      />
                    ) : null}

                    <div className="p-4 rounded-2xl bg-[#000000] border border-zinc-800 flex items-center justify-between">
                      <div className="flex items-center gap-3 truncate">
                        {getFileIcon(receivedItem.mimeType, receivedItem.fileName)}
                        <div className="truncate">
                          <div className="text-xs font-bold text-white truncate">
                            {receivedItem.fileName || "Media Attachment"}
                          </div>
                          <div className="text-[10px] font-mono text-zinc-500">
                            {formatBytes(receivedItem.fileSize)}
                          </div>
                        </div>
                      </div>

                      <a
                        href={`/api/public/download?url=${encodeURIComponent(receivedItem.mediaUrl)}&name=${encodeURIComponent(receivedItem.fileName || "media_file")}`}
                        download={receivedItem.fileName || "media_file"}
                        className="h-9 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs transition-all flex items-center justify-center gap-1.5 active:scale-95 shrink-0"
                        title="Direct Download File"
                      >
                        <Download className="size-3.5" />
                        <span>Download</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* RECENT LOCAL HISTORY LIST */}
        {history.length > 0 && (
          <div className="p-5 rounded-3xl border border-zinc-800 bg-[#09090b] space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-white">
              <span>Recent Transfer History</span>
              <button
                onClick={() => {
                  setHistory([]);
                  localStorage.removeItem("crossdevice_history");
                }}
                className="text-[10px] font-mono text-zinc-500 hover:text-red-400"
              >
                Clear History
              </button>
            </div>

            <div className="space-y-2">
              {history.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setReceiveCode(item.code);
                    setActiveTab("receive");
                    fetchReceivedItem(item.code);
                  }}
                  className="p-3 rounded-2xl bg-[#000000] border border-zinc-800/80 hover:border-zinc-700 flex items-center justify-between cursor-pointer transition-all active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3 truncate">
                    <span className="px-2 py-0.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 font-mono text-[10px] font-bold">
                      {item.code}
                    </span>
                    <span className="text-xs font-semibold text-zinc-300 truncate max-w-[200px]">
                      {item.title || "Clipboard Data"}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500">{item.date}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export const Route = createFileRoute("/clipboard")({
  component: CrossDeviceClipboardPage,
  head: () => ({
    meta: [
      { title: "Cross-Device Clipboard • 7-Digit Transfer" },
      { name: "description", content: "Instant cross-device text and media clipboard sharing powered by nonxe/crossdevice with 7-digit code." },
    ],
  }),
});
