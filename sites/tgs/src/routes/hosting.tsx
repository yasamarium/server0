import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { 
  Globe, 
  ExternalLink, 
  ArrowLeft, 
  Database, 
  ShieldCheck, 
  Server, 
  Zap, 
  MessageSquare, 
  Upload, 
  Code2, 
  Sun, 
  Moon,
  Sparkles
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { ASCLOUD_HOSTING_URL } from "../lib/constants";

export const Route = createFileRoute("/hosting")({
  head: () => ({
    meta: [
      { title: "AS Cloud Hosting • Subsite Node" },
      { name: "description", content: "Decentralized file hosting, Vault Drops, interactive chatting, API and developer console." }
    ]
  }),
  component: HostingSubsitePortal,
});

function HostingSubsitePortal() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const saved = localStorage.getItem("theme") as "light" | "dark" | null;
    const initial = saved || "dark";
    setTheme(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  const subsiteFeatures = [
    {
      title: "Decentralized File Vault",
      desc: "Instant multi-file upload, 100MB chunked streaming, and private release assets storage.",
      icon: Upload,
      color: "text-amber-400 border-amber-500/20 bg-amber-500/5"
    },
    {
      title: "Interactive Chats & Drops",
      desc: "Real-time Telegram-style encrypted chats with 1-click Cloud Vault Drop attachments.",
      icon: MessageSquare,
      color: "text-purple-400 border-purple-500/20 bg-purple-500/5"
    },
    {
      title: "Inbuilt QWERTY & Emoji Keyboard",
      desc: "Full in-browser typing keyboard with 2,600+ Unicode emojis & symbols for phone & PC.",
      icon: Sparkles,
      color: "text-pink-400 border-pink-500/20 bg-pink-500/5"
    },
    {
      title: "REST & Edge Database",
      desc: "Direct REST API database endpoints, authentication tokens, and audit log pipelines.",
      icon: Database,
      color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5"
    }
  ];

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-300 relative select-text">
      {/* Background Glows */}
      <div className="orb orb-1 opacity-40" />
      <div className="orb orb-2 opacity-40" />

      {/* Header Bar */}
      <header className="px-4 sm:px-6 md:px-8 py-4 flex items-center justify-between max-w-5xl mx-auto w-full border-b border-border/40 backdrop-blur-md sticky top-0 z-40 bg-background/85">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="size-9 rounded-full bg-secondary/50 border border-border/60 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-base sm:text-lg font-black tracking-tight">AS CLOUD</span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-[10px] font-mono font-bold text-amber-400 uppercase">
              Subsite Node
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={ASCLOUD_HOSTING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-black font-bold text-xs flex items-center gap-1.5 shadow-md hover:brightness-110 active:scale-95 transition-all"
          >
            <span>Launch Node</span>
            <ExternalLink className="size-3.5" />
          </a>
          <button
            onClick={toggleTheme}
            className="size-9 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-all active:scale-90"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 sm:py-12 flex flex-col items-center justify-center text-center space-y-8 z-10">
        {/* Node Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold backdrop-blur-md">
          <span className="size-2 rounded-full bg-amber-400 animate-ping"></span>
          <span>Official AS Cloud Subsite • Serverless Hosting</span>
        </div>

        {/* Hero Title */}
        <div className="space-y-3 max-w-2xl">
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            AS Cloud Hosting & Dev Node
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            High-speed serverless hosting node with integrated Vault Drops, Telegram-style encrypted chats, in-browser keyboards, and direct REST API database integration.
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3.5">
          <a
            href={ASCLOUD_HOSTING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 rounded-2xl bg-white text-black hover:bg-zinc-200 font-extrabold text-sm flex items-center gap-2 shadow-xl shadow-white/5 active:scale-95 transition-all"
          >
            <Globe className="size-4.5" />
            <span>Open dev.asum.workers.dev</span>
            <ExternalLink className="size-4" />
          </a>
          <Link
            to="/"
            className="px-5 py-3 rounded-2xl bg-secondary/30 hover:bg-secondary/60 border border-border text-foreground font-bold text-sm transition-all"
          >
            Back to Home Dashboard
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full pt-6 text-left">
          {subsiteFeatures.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="p-5 rounded-2xl border border-border/40 bg-secondary/10 ios-glass space-y-2 hover:border-white/20 transition-colors"
              >
                <div className={`size-10 rounded-xl border flex items-center justify-center ${f.color}`}>
                  <Icon className="size-5" />
                </div>
                <h3 className="text-base font-bold text-foreground">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Subsite URL Reference Box */}
        <div className="w-full p-4 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400 font-mono">
          <div className="flex items-center gap-2 truncate">
            <Server className="size-4 text-amber-400 flex-shrink-0" />
            <span className="text-zinc-500">Target Node:</span>
            <span className="text-zinc-200 font-semibold truncate">{ASCLOUD_HOSTING_URL}</span>
          </div>
          <a
            href={ASCLOUD_HOSTING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-400 hover:text-amber-300 underline underline-offset-4 flex-shrink-0"
          >
            Launch directly →
          </a>
        </div>
      </div>
    </main>
  );
}
