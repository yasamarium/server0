import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { ASCLOUD_HOSTING_URL } from "../lib/constants";

export const Route = createFileRoute("/note")({
  component: NoteLayout,
});

function NoteLayout() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const location = useLocation();

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const initialTheme = savedTheme || "dark";
    setTheme(initialTheme);
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.classList.toggle("dark", next === "dark");
  };

  const isReaderPage = location.pathname !== "/note" && location.pathname !== "/note/";

  if (isReaderPage) {
    return <Outlet />;
  }

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-300 relative overflow-hidden">
      {/* Header */}
      <header className="px-6 py-6 flex items-center justify-between max-w-2xl md:max-w-6xl mx-auto w-full border-b border-border/40 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-[20px] font-black tracking-tighter select-none opacity-40 hover:opacity-100 transition-opacity">
            CLOUD
          </Link>
          <Link to="/note" className="text-[20px] font-black tracking-tighter select-none">
            NOTES
          </Link>
          <Link to="/convert" className="text-[20px] font-black tracking-tighter select-none opacity-40 hover:opacity-100 transition-opacity">
            CONVERTS
          </Link>
          <Link to="/more" className="text-[20px] font-black tracking-tighter select-none opacity-40 hover:opacity-100 transition-opacity">
            MORE
          </Link>
          <Link to="/owner" className="text-[20px] font-black tracking-tighter select-none opacity-40 hover:opacity-100 transition-opacity">
            OWNER INFO
          </Link>
          <a 
            href={ASCLOUD_HOSTING_URL} 
            target="_blank"
            rel="noopener noreferrer"
            className="text-[20px] font-black tracking-tighter select-none opacity-80 hover:opacity-100 transition-opacity text-amber-400 flex items-center gap-1"
            title="AS Cloud Hosting Subsite"
          >
            <span>HOSTING</span>
            <span className="text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300">
              DEV
            </span>
          </a>
        </div>

        <div className="flex items-center gap-2.5">
          <button 
            onClick={toggleTheme}
            className="size-10 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-all active:scale-90"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </button>
        </div>
      </header>

      {/* Render child route contents (Composer or Reader) */}
      <Outlet />
    </main>
  );
}
