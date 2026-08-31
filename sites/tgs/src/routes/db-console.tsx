import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { 
  Sun, 
  Moon, 
  Database 
} from "lucide-react";
import { DbConsole } from "./-db";

export const Route = createFileRoute("/db-console")({
  component: DbConsolePage,
});

export function DbConsolePage() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

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

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-300 relative select-text">
      
      {/* Header */}
      <header className="px-4 sm:px-6 py-4 sm:py-6 flex items-center justify-between max-w-4xl mx-auto w-full border-b border-border/40 backdrop-blur-md sticky top-0 z-40 bg-background/85 select-none">
        <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto">
          <Link to="/" className="text-[16px] sm:text-[20px] font-black tracking-tighter select-none opacity-40 hover:opacity-100 transition-opacity flex-shrink-0">
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
        </div>

        <button 
          onClick={toggleTheme}
          className="size-10 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-all active:scale-90 flex-shrink-0 ml-3"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
        </button>
      </header>

      {/* Main Console View */}
      <section className="flex-1 w-full max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <div className="flex items-center gap-3 mb-6 select-none justify-center md:justify-start">
          <div className="size-11 rounded-[16px] border border-purple-500/20 bg-purple-500/5 flex items-center justify-center text-purple-400 shadow-sm">
            <Database className="size-5.5" />
          </div>
          <h2 className="text-[26px] font-black tracking-tight text-foreground">ssDB Developer Console</h2>
        </div>
        <DbConsole />
      </section>

    </main>
  );
}
