import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { 
  Sun, 
  Moon, 
  Sparkles,
  MessageSquare,
  Send,
  Trash2,
  User,
  Bot,
  Info,
  Globe,
  Music,
  Mail,
  Lock,
  ArrowLeft,
  Zap,
  BrainCircuit
} from "lucide-react";

export const Route = createFileRoute("/more")({
  component: MorePage,
});

type ModelType = "haiku" | "opus";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function MorePage({ embed = false }: { embed?: boolean }) {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [selectedModel, setSelectedModel] = useState<ModelType>("haiku");

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

  const content = (
    <section className={`flex-1 flex flex-col w-full gap-6 ${embed ? "py-2" : "px-4 py-8 max-w-4xl mx-auto"}`}>
      {/* Intro Header */}
      {!embed && (
        <div className="text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-[28px] md:text-[36px] font-black tracking-tight leading-tight select-none">
              Claude AI Assistant.
              <br />
              <span className="opacity-40">
                {selectedModel === "haiku" ? "Claude 4.5 Haiku • Fast & Intelligent" : "Claude 4.8 Opus • Deep Reasoning & Complex Tasks"}
              </span>
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground max-w-md">
              Powered by Anthropic Claude models for code generation, writing, math, and general reasoning.
            </p>
          </div>
        </div>
      )}

      {/* Main Workspace */}
      <div className="w-full">
        <ChatTool selectedModel={selectedModel} onModelChange={setSelectedModel} />
      </div>
    </section>
  );

  if (embed) return content;

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-300 relative overflow-hidden">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between max-w-4xl mx-auto w-full border-b border-border/40 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Link to="/" className="size-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-all">
            <ArrowLeft className="size-4" />
          </Link>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Sparkles className="size-4" />
            </span>
            <h1 className="text-base font-bold tracking-tight text-foreground">
              Claude AI Assistant
            </h1>
          </div>
        </div>

        <button 
          onClick={toggleTheme}
          className="size-9 rounded-xl border border-border flex items-center justify-center hover:bg-secondary transition-all active:scale-90"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </button>
      </header>

      {content}
    </main>
  );
}

/* ==========================================================================
   Claude AI Chat Tool with Model Switching (Haiku 4.5 & Opus 4.8)
   ========================================================================== */
function ChatTool({ 
  selectedModel, 
  onModelChange 
}: { 
  selectedModel: ModelType; 
  onModelChange: (model: ModelType) => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const apiUrl = selectedModel === "opus"
        ? `https://apis.davidcyril.name.ng/ai/claude-opus-4.8?prompt=${encodeURIComponent(userMessage)}`
        : `https://apis.davidcyril.name.ng/ai/claude-haiku-4.5?prompt=${encodeURIComponent(userMessage)}`;

      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error("API request failed");
      const data = await res.json();
      
      const reply = data.data || data.result || data.response || data.message || "No response received from Claude.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev, 
        { role: "assistant", content: `Error: Unable to connect to Claude ${selectedModel === "opus" ? "4.8 Opus" : "4.5 Haiku"} API. Please try again shortly.` }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="rounded-2xl border border-border/80 p-5 bg-card flex flex-col h-[580px] relative overflow-hidden shadow-2xl">
      {/* Active Model Header & Switcher */}
      <div className="flex items-center justify-between pb-3.5 border-b border-border/50 select-none flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            {selectedModel === "opus" ? <BrainCircuit className="size-4 text-purple-400" /> : <Sparkles className="size-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground">
                {selectedModel === "opus" ? "Claude 4.8 Opus" : "Claude 4.5 Haiku"}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-mono font-bold border ${
                selectedModel === "opus" 
                  ? "bg-purple-500/10 text-purple-400 border-purple-500/20" 
                  : "bg-amber-500/10 text-amber-400 border-amber-500/20"
              }`}>
                {selectedModel === "opus" ? "Opus Engine" : "Haiku Engine"}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground font-mono">
              {selectedModel === "opus" ? "Deep Reasoning & Complex Analysis" : "Fast & Intelligent Assistant"}
            </p>
          </div>
        </div>

        {/* Model Switcher Pills */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 rounded-xl bg-secondary border border-border text-xs font-mono">
            <button
              type="button"
              onClick={() => onModelChange("haiku")}
              className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                selectedModel === "haiku" 
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Zap className="size-3" />
              <span>Haiku 4.5</span>
            </button>
            <button
              type="button"
              onClick={() => onModelChange("opus")}
              className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
                selectedModel === "opus" 
                  ? "bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <BrainCircuit className="size-3" />
              <span>Opus 4.8</span>
            </button>
          </div>

          <button 
            onClick={clearChat}
            className="size-8 rounded-xl border border-border hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-all active:scale-95"
            title="Clear Chat History"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Messages Timeline */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-6 select-none">
            <div className={`size-12 rounded-2xl border flex items-center justify-center mb-3 ${
              selectedModel === "opus" ? "bg-purple-500/10 border-purple-500/20 text-purple-400" : "bg-amber-500/10 border-amber-500/20 text-amber-400"
            }`}>
              {selectedModel === "opus" ? <BrainCircuit className="size-6" /> : <Bot className="size-6" />}
            </div>
            <p className="text-sm font-bold text-foreground">
              {selectedModel === "opus" ? "Claude 4.8 Opus AI Assistant" : "Claude 4.5 Haiku AI Assistant"}
            </p>
            <p className="text-xs text-muted-foreground max-w-sm mt-1 leading-relaxed">
              {selectedModel === "opus" 
                ? "Engineered for deep reasoning, complex code generation, literature analysis, and advanced problem solving."
                : "Ask anything about coding, creative writing, analysis, math, or general reasoning."}
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`flex items-start gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              <div className={`size-7 rounded-xl border flex items-center justify-center flex-shrink-0 ${
                msg.role === "user" 
                  ? "bg-foreground border-foreground text-background" 
                  : selectedModel === "opus"
                    ? "bg-purple-500/10 border-purple-500/30 text-purple-400"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-400"
              }`}>
                {msg.role === "user" ? <User className="size-3.5" /> : <Bot className="size-3.5" />}
              </div>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                msg.role === "user" 
                  ? "bg-secondary text-foreground border border-border" 
                  : "bg-secondary/40 text-foreground border border-border/50"
              }`} style={{ whiteSpace: "pre-wrap" }}>
                {msg.content}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex items-start gap-3">
            <div className={`size-7 rounded-xl border flex items-center justify-center ${
              selectedModel === "opus" ? "bg-purple-500/10 border-purple-500/30 text-purple-400" : "bg-amber-500/10 border-amber-500/30 text-amber-400"
            }`}>
              <Bot className="size-3.5" />
            </div>
            <div className="bg-secondary/40 border border-border/50 rounded-2xl px-4 py-3 flex items-center gap-1.5">
              <span className={`size-1.5 rounded-full animate-bounce ${selectedModel === "opus" ? "bg-purple-400" : "bg-amber-400"}`} />
              <span className={`size-1.5 rounded-full animate-bounce [animation-delay:0.2s] ${selectedModel === "opus" ? "bg-purple-400" : "bg-amber-400"}`} />
              <span className={`size-1.5 rounded-full animate-bounce [animation-delay:0.4s] ${selectedModel === "opus" ? "bg-purple-400" : "bg-amber-400"}`} />
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="pt-3 border-t border-border/50 flex gap-2 flex-shrink-0 select-none">
        <input
          type="text"
          placeholder={selectedModel === "opus" ? "Ask Claude 4.8 Opus anything..." : "Ask Claude 4.5 Haiku anything..."}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          className="flex-1 bg-background text-xs font-bold border border-border rounded-xl px-4 py-3 outline-none focus:border-amber-500/50 transition-all placeholder:font-normal placeholder:text-muted-foreground/50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 h-10 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs uppercase tracking-wider flex items-center justify-center active:scale-95 disabled:opacity-40 transition-all flex-shrink-0"
        >
          <Send className="size-4" />
        </button>
      </form>
    </div>
  );
}
