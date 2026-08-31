import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Sun,
  Moon,
  ArrowLeft,
  AlertCircle
} from "lucide-react";

export const Route = createFileRoute("/x")({
  head: () => ({
    meta: [
      { title: "X Space — Service Under Maintenance" },
      {
        name: "description",
        content: "X Space service is temporarily under maintenance. Please check back later.",
      },
    ],
  }),
  component: XViewerPage,
});

function XViewerPage() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const saved = localStorage.getItem("theme") as "light" | "dark" | null;
    const t = saved || "dark";
    setTheme(t);
    document.documentElement.classList.toggle("dark", t === "dark");
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  return (
    <main className="min-h-screen bg-background text-foreground font-sans transition-colors duration-300 flex flex-col overflow-hidden h-screen relative">
      {/* ── Header ── */}
      <header className="px-5 py-4 flex items-center justify-between border-b border-border/40 backdrop-blur-md sticky top-0 z-45 bg-background/80 flex-shrink-0 select-none">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="size-9 rounded-full border border-border flex items-center justify-center hover:bg-secondary active:scale-90 transition-all"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-full bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="size-4.5 text-sky-500 fill-current">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </div>
            <div>
              <h1 className="text-[16px] font-black tracking-tight leading-tight">X SPACE</h1>
              <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">
                Anonymous Cloud Utility
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="size-9 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-all active:scale-90"
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
        </div>
      </header>

      {/* ── Under Maintenance Body ── */}
      <div className="flex-1 flex items-center justify-center p-5 bg-secondary/5 overflow-y-auto">
        <div className="w-full max-w-md rounded-[24px] border border-border bg-card p-8 shadow-2xl relative overflow-hidden ios-glass ios-shadow animate-spring-scale text-center space-y-6">
          <div className="size-16 rounded-[20px] bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mx-auto shadow-sm animate-pulse">
            <AlertCircle className="size-8" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-[20px] font-black tracking-tight uppercase">Service Under Maintenance</h2>
            <p className="text-[12.5px] text-muted-foreground leading-normal max-w-xs mx-auto font-bold">
              The X (Twitter) utility is temporarily offline due to API updates and standard system maintenance. We will be back online shortly.
            </p>
          </div>

          <div className="pt-2">
            <Link
              to="/"
              className="inline-flex h-11 px-6 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black text-[13px] items-center justify-center gap-2 transition-all select-none shadow-md"
            >
              <ArrowLeft className="size-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
