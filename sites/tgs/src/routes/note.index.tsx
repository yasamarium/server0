import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { 
  Copy, 
  Trash2, 
  BookOpen,
  ArrowRight,
  Sparkles,
  Link as LinkIcon
} from "lucide-react";

interface NoteHistoryItem {
  path: string;
  title: string;
  timestamp: number;
  wordCount: number;
}

export const Route = createFileRoute("/note/")({
  component: NoteComposer,
});

export function NoteComposer() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<NoteHistoryItem[]>([]);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();

  // Load history
  useEffect(() => {
    const savedHistory = localStorage.getItem("note_history");
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch {
        // Ignore
      }
    }
  }, []);

  const getTelegraphToken = async (): Promise<string> => {
    let token = localStorage.getItem("tg_token");
    if (!token) {
      try {
        const res = await fetch("https://api.telegra.ph/createAccount?short_name=iOSNotes&author_name=Anonymous");
        const data = await res.json();
        if (data.ok) {
          token = data.result.access_token;
          if (token) localStorage.setItem("tg_token", token);
        }
      } catch (e) {
        console.error("Token creation failed, trying fallback...", e);
      }
    }
    return token || "b968da50dcdb253c9e04a36e35ac26f5619621f6a13d1a52c3c4314c13a0";
  };

  const CHARS_63 = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-";
  const CHARS_62 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

  const encodeSlug = (slug: string): string => {
    let val = 1n; // Sentinel
    for (let i = 0; i < slug.length; i++) {
      const idx = BigInt(CHARS_63.indexOf(slug[i]));
      val = val * 63n + idx;
    }
    
    let res = "";
    while (val > 0n) {
      const rem = val % 62n;
      res = CHARS_62[Number(rem)] + res;
      val = val / 62n;
    }
    return res;
  };

  const textToTelegraphNodes = (text: string) => {
    return text.split("\n").map((line) => ({
      tag: "p",
      children: [line || " "],
    }));
  };

  const publishNote = async () => {
    const finalTitle = title.trim() || "Untitled Note";
    const finalContent = content.trim();

    if (!finalContent) {
      setError("Please write some content in your note.");
      return;
    }

    setBusy(true);
    setError(null);
    setPublishedUrl(null);

    try {
      let token = await getTelegraphToken();
      
      // Prepend the title inside the content nodes array under an h1 element
      const nodes = [
        {
          tag: "h1",
          children: [finalTitle]
        },
        ...textToTelegraphNodes(finalContent)
      ];

      const attempt = async (activeToken: string) => {
        const formData = new URLSearchParams();
        formData.append("access_token", activeToken);
        formData.append("title", "n"); // Short fixed title to guarantee ultra-short path slug
        formData.append("content", JSON.stringify(nodes));
        formData.append("return_content", "true");

        const response = await fetch("https://api.telegra.ph/createPage", {
          method: "POST",
          body: formData,
        });
        return await response.json();
      };

      let data = await attempt(token);

      if (!data.ok && data.error === "ACCOUNT_NOT_FOUND") {
        console.warn("Telegraph token was invalid. Refreshing token...");
        localStorage.removeItem("tg_token");
        const newToken = await getTelegraphToken();
        data = await attempt(newToken);
      }

      if (data.ok && data.result?.path) {
        const path = data.result.path;
        const shortCode = encodeSlug(path);
        const finalUrl = `${window.location.origin}/note/${shortCode}`;
        setPublishedUrl(finalUrl);

        // Save to local history
        const newHistoryItem: NoteHistoryItem = {
          path: shortCode,
          title: finalTitle,
          timestamp: Date.now(),
          wordCount: finalContent.split(/\s+/).filter(Boolean).length,
        };

        const updatedHistory = [newHistoryItem, ...history.filter(h => h.path !== shortCode)];
        setHistory(updatedHistory);
        localStorage.setItem("note_history", JSON.stringify(updatedHistory));

        // Reset composer
        setTitle("");
        setContent("");
      } else {
        throw new Error(data.error || "Telegraph API reported failure");
      }
    } catch (e) {
      setError((e as Error).message || "Failed to publish note");
    } finally {
      setBusy(false);
    }
  };

  const copyLink = async () => {
    if (!publishedUrl) return;
    await navigator.clipboard.writeText(publishedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const deleteFromHistory = (path: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const updated = history.filter((h) => h.path !== path);
    setHistory(updated);
    localStorage.setItem("note_history", JSON.stringify(updated));
  };

  const formatRelativeTime = (ts: number) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  return (
    <section className="flex-1 flex flex-col px-4 py-8 max-w-2xl md:max-w-6xl mx-auto w-full gap-6">
      {error && (
        <div className="rounded-[16px] border border-destructive/20 bg-destructive/5 text-destructive text-[14px] font-semibold p-4 text-center animate-shiver">
          {error}
        </div>
      )}

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-start flex-1 w-full">
        {/* Left Column: Note Editor */}
        <div className="md:col-span-3 flex flex-col gap-4 w-full h-full min-h-[400px]">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <input
              type="text"
              placeholder="Title (Optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 bg-secondary/35 text-[18px] sm:text-[20px] md:text-[24px] font-black tracking-tight placeholder-foreground/30 border border-border/30 rounded-[16px] sm:rounded-[20px] px-4 sm:px-5 py-3.5 sm:py-4 outline-none focus:border-foreground/50 transition-all focus:bg-secondary/60"
              maxLength={100}
            />
            <button
              onClick={publishNote}
              disabled={busy || !content.trim()}
              className="w-full sm:w-auto h-12 sm:h-[60px] px-6 rounded-[16px] sm:rounded-[20px] bg-foreground text-background font-bold text-[14px] sm:text-[14.5px] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none ios-tap-active flex items-center justify-center gap-1.5 flex-shrink-0"
            >
              {busy ? "Saving..." : "Save Note"}
            </button>
          </div>

          <textarea
            ref={contentRef}
            placeholder="Start typing your note here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full flex-1 min-h-[350px] bg-secondary/35 text-[17px] leading-[1.65] placeholder-foreground/30 border border-border/30 rounded-[24px] p-6 outline-none focus:border-foreground/50 transition-all resize-none focus:bg-secondary/60 font-sans"
          />
        </div>

        {/* Right Column: Published Notes History */}
        <div className="md:col-span-2 w-full space-y-4">
          {history.length > 0 ? (
            <div className="space-y-4 animate-slide-up">
              <h3 className="text-[17px] font-black tracking-tight border-b border-border/30 pb-2.5 flex items-center gap-2 select-none">
                <BookOpen className="size-4.5 opacity-60" />
                <span>Published Notes</span>
              </h3>

              <div className="grid gap-2 max-h-[480px] overflow-y-auto pr-1">
                {history.map((item) => (
                  <div
                    key={item.path}
                    onClick={() => navigate({ to: `/note/${item.path}` })}
                    className="group flex items-center justify-between p-4 rounded-[18px] border border-border/40 hover:border-foreground/45 hover:bg-secondary/20 transition-all duration-300 cursor-pointer ios-glass"
                  >
                    <div className="min-w-0 flex-1 pr-4">
                      <p className="text-[15px] font-bold truncate tracking-tight">{item.title}</p>
                      <p className="text-[13px] text-muted-foreground mt-0.5">
                        {item.wordCount} words • {formatRelativeTime(item.timestamp)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => deleteFromHistory(item.path, e)}
                        className="size-8 rounded-full hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all"
                        title="Remove from history"
                      >
                        <Trash2 className="size-4" />
                      </button>
                      <ArrowRight className="size-4 opacity-30 group-hover:opacity-80 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-border/40 rounded-[24px] p-8 text-center text-muted-foreground/70 select-none">
              <BookOpen className="size-8 mx-auto mb-3 opacity-40" />
              <p className="text-[14px] font-semibold">No published notes yet</p>
              <p className="text-[12px] mt-1 text-muted-foreground/50">Your published notes will appear here on this device.</p>
            </div>
          )}
        </div>
      </div>

      {/* Published Link Modal */}
      {publishedUrl && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-sm rounded-[24px] border border-border bg-card p-6 space-y-6 ios-glass ios-shadow animate-spring-scale text-center">
            <div className="mx-auto size-14 rounded-[20px] bg-foreground/5 flex items-center justify-center text-foreground">
              <Sparkles className="size-6 text-foreground animate-pulse" />
            </div>

            <div className="space-y-2">
              <h3 className="text-[20px] font-black tracking-tight">Note Published!</h3>
              <p className="text-[14px] text-muted-foreground max-w-xs mx-auto">
                Your note is saved permanently and anonymously on the cloud. Share the link below:
              </p>
            </div>

            <div className="bg-secondary/40 border border-border/30 rounded-[16px] p-3 text-[14px] font-semibold break-all text-center flex items-center justify-center gap-2">
              <LinkIcon className="size-4 opacity-50 flex-shrink-0" />
              <span>{publishedUrl}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setPublishedUrl(null)}
                className="h-12 rounded-full border border-border font-bold text-[14px] hover:bg-secondary active:scale-[0.97] transition-all"
              >
                Close
              </button>
              <button
                onClick={copyLink}
                className={`h-12 rounded-full font-bold text-[14px] text-background bg-foreground hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 ${
                  copied ? "bg-green-600 text-white" : ""
                }`}
              >
                <Copy className="size-4" />
                {copied ? "Copied!" : "Copy Link"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
