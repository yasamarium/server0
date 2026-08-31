import { createFileRoute, Link, useLoaderData } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { 
  ArrowLeft, 
  Plus, 
  Copy,
  Calendar,
  User,
  Eye,
  Type,
  BookOpen
} from "lucide-react";

interface TelegraphNode {
  tag?: string;
  attrs?: Record<string, string>;
  children?: (string | TelegraphNode)[];
}

interface TelegraphPage {
  path: string;
  url: string;
  title: string;
  description: string;
  author_name?: string;
  views: number;
  content?: (string | TelegraphNode)[];
}

const CHARS_63 = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-";
const CHARS_62 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

function decodeSlug(code: string): string {
  let val = 0n;
  for (let i = 0; i < code.length; i++) {
    const idx = BigInt(CHARS_62.indexOf(code[i]));
    val = val * 62n + idx;
  }
  
  let res = "";
  while (val > 1n) { // Stop at sentinel
    const rem = val % 63n;
    res = CHARS_63[Number(rem)] + res;
    val = val / 63n;
  }
  return res;
}

export const Route = createFileRoute("/note/$noteId")({
  loader: async ({ params }) => {
    try {
      // If it contains a hyphen, it's a legacy clear-text path slug. Otherwise, it's an encoded short code.
      const targetPath = params.noteId.includes("-") ? params.noteId : decodeSlug(params.noteId);
      
      const res = await fetch(`https://api.telegra.ph/getPage/${targetPath}?return_content=true`);
      const data = await res.json();
      if (data.ok && data.result) {
        return { note: data.result as TelegraphPage };
      }
      throw new Error(data.error || "Note not found");
    } catch {
      throw new Error("Note not found or connection failed");
    }
  },
  component: ViewNotePage,
  errorComponent: ({ error }) => (
    <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 text-center relative overflow-hidden select-none">
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      
      <div className="max-w-md space-y-5 z-10 p-8 rounded-[24px] border border-border bg-[#08080c]/60 backdrop-blur-2xl ios-glass">
        <h1 className="text-[28px] font-black tracking-tight text-red-500">Note Not Found</h1>
        <p className="text-[14px] text-muted-foreground leading-relaxed">
          The anonymous note you are looking for does not exist, was deleted, or the sharing link is incorrect.
        </p>
        <div className="pt-2">
          <Link
            to="/"
            className="inline-flex h-11 items-center justify-center rounded-full bg-foreground text-background px-6 font-bold text-[13.5px] hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Go to Cloud OS
          </Link>
        </div>
      </div>
    </main>
  ),
});

function ViewNotePage() {
  const { note } = useLoaderData({ from: "/note/$noteId" });
  const [copied, setCopied] = useState(false);
  
  // Immersive customization states
  const [fontSize, setFontSize] = useState<"sm" | "md" | "lg">("md");
  const [fontFamily, setFontFamily] = useState<"serif" | "sans">("serif");

  const copyUrl = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderNodes = (nodes: (string | TelegraphNode)[] | undefined): React.ReactNode => {
    if (!nodes) return null;
    return nodes.map((node, i) => {
      if (typeof node === "string") {
        return node;
      }
      const tag = node.tag || "p";
      
      if (tag === "p") {
        return (
          <p key={i} className="mb-5 leading-[1.8] text-foreground/90">
            {renderNodes(node.children)}
          </p>
        );
      }

      if (tag === "b" || tag === "strong") {
        return <strong key={i} className="font-bold text-foreground">{renderNodes(node.children)}</strong>;
      }

      if (tag === "i" || tag === "em") {
        return <em key={i} className="italic text-foreground/80">{renderNodes(node.children)}</em>;
      }

      if (tag === "br") {
        return <br key={i} />;
      }

      const Tag = tag as any;
      return (
        <Tag key={i}>
          {renderNodes(node.children)}
        </Tag>
      );
    });
  };

  // Determine actual display title and content
  let displayTitle = note.title;
  let displayContent = note.content;

  if (note.content && note.content.length > 0) {
    const firstNode = note.content[0];
    if (typeof firstNode !== "string" && (firstNode.tag === "h1" || firstNode.tag === "h2")) {
      const extractedTitle = firstNode.children?.[0];
      if (typeof extractedTitle === "string") {
        displayTitle = extractedTitle;
        displayContent = note.content.slice(1);
      }
    }
  }

  // Fallback to title n cleanup
  if (displayTitle === "n") {
    displayTitle = "Untitled Note";
  }

  const fontClass = fontFamily === "serif" ? "font-serif" : "font-sans";
  const sizeClass = 
    fontSize === "sm" ? "text-[16px] md:text-[18px]" :
    fontSize === "md" ? "text-[18px] md:text-[21px]" :
    "text-[21px] md:text-[24px]";

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col items-center py-8 px-4 md:py-16 md:px-6 relative overflow-y-auto select-text">
      {/* Ambient Moving Wallpaper Orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {/* Floating Header Controls */}
      <div className="w-full max-w-2xl flex items-center justify-between mb-8 select-none z-30">
        <Link
          to="/"
          className="h-10 px-4 rounded-full border border-border/70 bg-[#08080a]/60 backdrop-blur-md hover:bg-secondary flex items-center gap-1.5 font-bold text-[12.5px] active:scale-95 transition-all select-none"
        >
          <ArrowLeft className="size-4" />
          <span>Dashboard</span>
        </Link>

        {/* Reading Preference Toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFontFamily(prev => prev === "serif" ? "sans" : "serif")}
            title="Toggle Font Family"
            className="size-10 rounded-full border border-border/70 bg-[#08080a]/60 backdrop-blur-md hover:bg-secondary flex items-center justify-center active:scale-90 transition-all"
          >
            <Type className="size-4 text-purple-400" />
          </button>
          
          <button
            onClick={() => setFontSize(prev => prev === "sm" ? "md" : prev === "md" ? "lg" : "sm")}
            title="Adjust Size"
            className="size-10 rounded-full border border-border/70 bg-[#08080a]/60 backdrop-blur-md hover:bg-secondary flex items-center justify-center font-black text-[12px] text-purple-400 active:scale-90 transition-all"
          >
            {fontSize.toUpperCase()}
          </button>

          <button
            onClick={copyUrl}
            className="h-10 px-4 rounded-full border border-border/70 bg-[#08080a]/60 backdrop-blur-md hover:bg-secondary flex items-center gap-1.5 font-bold text-[12.5px] active:scale-95 transition-all select-none"
          >
            <Copy className="size-4" />
            <span>{copied ? "Copied!" : "Copy Link"}</span>
          </button>
        </div>
      </div>

      {/* Main Glass Reader Slate */}
      <article className="w-full max-w-2xl rounded-[32px] border border-border bg-[#050508]/80 backdrop-blur-3xl p-6 md:p-10 space-y-6 z-10 shadow-2xl relative overflow-hidden ios-glass">
        
        {/* Title */}
        <h1 className="text-[32px] md:text-[42px] font-black tracking-tight leading-[1.1] text-foreground">
          {displayTitle}
        </h1>

        {/* Shared Note Metadata badge */}
        <div className="flex flex-wrap items-center gap-4 text-[12.5px] text-muted-foreground border-y border-border/20 py-3.5 select-none">
          <div className="flex items-center gap-1.5">
            <User className="size-4 text-purple-500" />
            <span>{note.author_name || "Anonymous"}</span>
          </div>
          <div className="size-1 rounded-full bg-border" />
          <div className="flex items-center gap-1.5">
            <Eye className="size-4 text-purple-500" />
            <span>{note.views} views</span>
          </div>
          <div className="size-1 rounded-full bg-border" />
          <div className="flex items-center gap-1.5">
            <Calendar className="size-4 text-purple-500" />
            <span>CLOUD Note</span>
          </div>
        </div>

        {/* Note Body with customized font preferences */}
        <div className={`pt-4 text-foreground/95 select-text leading-relaxed max-w-none prose dark:prose-invert ${fontClass} ${sizeClass}`}>
          {renderNodes(displayContent)}
        </div>

        {/* Slate Bottom Banner */}
        <div className="pt-8 border-t border-border/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
          <div className="flex items-center gap-2 text-[12px] text-muted-foreground font-semibold">
            <BookOpen className="size-4 text-purple-500/80 animate-pulse" />
            <span>Secure anonymous reader mode</span>
          </div>
          
          <Link
            to="/"
            className="h-10 px-5 rounded-full bg-foreground text-background font-bold text-[12.5px] hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 select-none"
          >
            <Plus className="size-3.5" />
            <span>Create New Note</span>
          </Link>
        </div>

      </article>
    </main>
  );
}
