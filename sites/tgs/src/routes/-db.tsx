import { useState, useEffect } from "react";
import { 
  Database, 
  Terminal, 
  Copy, 
  Check, 
  BookOpen, 
  Play, 
  Send, 
  ArrowRight,
  Code2,
  Plus
} from "lucide-react";

export function DbConsole() {
  // Publisher state
  const [title, setTitle] = useState("");
  const [associatedUrl, setAssociatedUrl] = useState("");
  const [payload, setPayload] = useState("{\n  \"status\": \"success\",\n  \"message\": \"Hello from ssDB\"\n}");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dbKey, setDbKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  // Playground state
  const [searchKey, setSearchKey] = useState("");
  const [fetching, setFetching] = useState(false);
  const [playError, setPlayError] = useState<string | null>(null);
  const [playResult, setPlayResult] = useState<string | null>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState<"docs" | "create" | "play">("docs");
  
  // Origin State for code samples
  const [origin, setOrigin] = useState("https://yourdomain.com");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOrigin(window.location.origin);
    }
  }, []);

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

  const getTelegraphToken = async (): Promise<string> => {
    let token = localStorage.getItem("tg_token");
    if (!token) {
      try {
        const res = await fetch("https://api.telegra.ph/createAccount?short_name=ssDB&author_name=Anonymous");
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

  const handleCreateNode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setDbKey(null);
    
    const cleanPayload = payload.trim();
    if (!cleanPayload) {
      setError("Payload cannot be empty.");
      return;
    }

    // Try to validate JSON
    try {
      JSON.parse(cleanPayload);
    } catch {
      if (!confirm("Payload does not appear to be valid JSON. Do you still want to save it as raw text?")) {
        return;
      }
    }

    setBusy(true);
    try {
      let token = await getTelegraphToken();
      
      // Wrap note data in Telegra.ph structure
      // H3 = Title, H4 = Associated URL (optional), remaining text = P tags
      const nodes: any[] = [
        {
          tag: "h3",
          children: [title.trim() || "ssDB Node"]
        }
      ];

      if (associatedUrl.trim()) {
        nodes.push({
          tag: "h4",
          children: [associatedUrl.trim()]
        });
      }

      nodes.push(...cleanPayload.split("\n").map(line => ({
        tag: "p",
        children: [line || " "]
      })));

      const attempt = async (activeToken: string) => {
        const formData = new URLSearchParams();
        formData.append("access_token", activeToken);
        formData.append("title", "n"); // Short fixed title for short code path
        formData.append("content", JSON.stringify(nodes));

        const response = await fetch("https://api.telegra.ph/createPage", {
          method: "POST",
          body: formData,
        });
        return await response.json();
      };

      let data = await attempt(token);

      // Self-Healing: If token is invalid (ACCOUNT_NOT_FOUND), clear bad token and retry with a new one
      if (!data.ok && data.error === "ACCOUNT_NOT_FOUND") {
        console.warn("Telegraph token was invalid. Refreshing token...");
        localStorage.removeItem("tg_token");
        const newToken = await getTelegraphToken();
        data = await attempt(newToken);
      }

      if (data.ok && data.result?.path) {
        const shortCode = encodeSlug(data.result.path);
        setDbKey(shortCode);
        setTitle("");
        setAssociatedUrl("");
        setPayload("{\n  \n}");
      } else {
        throw new Error(data.error || "Telegra.ph rejected request");
      }
    } catch (err: any) {
      setError(err.message || "Failed to create database node.");
    } finally {
      setBusy(false);
    }
  };

  const handlePlaygroundFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    setPlayError(null);
    setPlayResult(null);

    const key = searchKey.trim();
    if (!key) return;

    setFetching(true);
    try {
      const res = await fetch(`/db/${key}`);
      const data = await res.json();
      if (res.ok) {
        setPlayResult(JSON.stringify(data, null, 2));
      } else {
        setPlayError(data.error || "Key not found");
      }
    } catch {
      setPlayError("Connection failed");
    } finally {
      setFetching(false);
    }
  };

  const copyText = async (text: string, type: "key" | "url") => {
    await navigator.clipboard.writeText(text);
    if (type === "key") {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 1500);
    } else {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 1500);
    }
  };

  const getDbUrl = (key: string) => {
    return `${origin}/db/${key}`;
  };

  return (
    <div className="w-full flex flex-col md:flex-row gap-6 md:gap-8 items-start select-text text-left">
      
      {/* Sidebar: Navigation tabs */}
      <div className="w-full md:w-56 flex md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none flex-shrink-0 select-none">
        <button
          onClick={() => setActiveTab("docs")}
          className={`flex items-center gap-3 px-4 py-3.5 rounded-[16px] border font-bold text-[13.5px] whitespace-nowrap transition-all w-full ${
            activeTab === "docs"
              ? "bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-500/10"
              : "border-border/60 hover:bg-secondary/40 text-muted-foreground hover:text-foreground"
          }`}
        >
          <BookOpen className="size-4.5" />
          <span>REST API Docs</span>
        </button>

        <button
          onClick={() => setActiveTab("create")}
          className={`flex items-center gap-3 px-4 py-3.5 rounded-[16px] border font-bold text-[13.5px] whitespace-nowrap transition-all w-full ${
            activeTab === "create"
              ? "bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-500/10"
              : "border-border/60 hover:bg-secondary/40 text-muted-foreground hover:text-foreground"
          }`}
        >
          <Plus className="size-4.5" />
          <span>Create Data Node</span>
        </button>

        <button
          onClick={() => setActiveTab("play")}
          className={`flex items-center gap-3 px-4 py-3.5 rounded-[16px] border font-bold text-[13.5px] whitespace-nowrap transition-all w-full ${
            activeTab === "play"
              ? "bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-500/10"
              : "border-border/60 hover:bg-secondary/40 text-muted-foreground hover:text-foreground"
          }`}
        >
          <Play className="size-4.5" />
          <span>API Playground</span>
        </button>
      </div>

      {/* Main content display pane */}
      <div className="flex-1 w-full rounded-[24px] border border-border/80 bg-secondary/10 p-5 sm:p-7 ios-glass ios-shadow">
        
        {/* Tab 1: API Docs */}
        {activeTab === "docs" && (
          <div className="space-y-6 animate-slide-up text-left">
            <div className="space-y-1.5">
              <h3 className="text-[20px] font-black tracking-tight text-purple-400 flex items-center gap-2">
                <Database className="size-5.5" />
                <span>ssDB Engine API</span>
              </h3>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                ssDB is an ultra-fast, serverless JSON store built on top of our anonymous edge storage engine. You can dynamically create, publish, and fetch data nodes directly via REST endpoints with full CORS headers.
              </p>
            </div>

            {/* GET Node */}
            <div className="space-y-3.5 border-t border-border/30 pt-4">
              <h4 className="text-[14px] font-black text-foreground">1. Retrieve Data Node</h4>
              <div className="rounded-xl border border-border/30 bg-secondary/5 p-4 space-y-3.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold bg-green-500/10 text-green-500 border border-green-500/25 px-1.5 py-0.5 rounded">GET</span>
                  <code className="text-[12px] font-black text-foreground">{`${origin}/db/<unique_key>`}</code>
                </div>
                <p className="text-[11.5px] text-muted-foreground leading-relaxed">
                  Fetches the database record containing metadata (title, associated url, payload type, character/word count, views) and the raw or parsed JSON data.
                </p>
              </div>

              {/* Code Examples for GET */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="rounded-xl border border-border/30 bg-secondary/15 p-4 space-y-2.5">
                  <div className="flex items-center gap-2 text-purple-400">
                    <Code2 className="size-4" />
                    <span className="text-[12px] font-black">JavaScript Fetch (GET)</span>
                  </div>
                  <pre className="text-[10.5px] font-mono leading-relaxed bg-[#0b0b0e] p-3 rounded-lg border border-border/10 text-emerald-400 overflow-x-auto">
{`fetch("${origin}/db/demo-key")
  .then(res => res.json())
  .then(json => {
    console.log("Title:", json.title);
    console.log("Associated URL:", json.url);
    console.log("Payload:", json.data);
  });`}
                  </pre>
                </div>

                <div className="rounded-xl border border-border/30 bg-secondary/15 p-4 space-y-2.5">
                  <div className="flex items-center gap-2 text-purple-400">
                    <Terminal className="size-4" />
                    <span className="text-[12px] font-black">cURL (GET)</span>
                  </div>
                  <pre className="text-[10.5px] font-mono leading-relaxed bg-[#0b0b0e] p-3 rounded-lg border border-border/10 text-emerald-400 overflow-x-auto">
{`curl -X GET \\
  "${origin}/db/demo-key"`}
                  </pre>
                </div>
              </div>
            </div>

            {/* POST Create */}
            <div className="space-y-3.5 border-t border-border/30 pt-4">
              <h4 className="text-[14px] font-black text-foreground">2. Create Data Node Programmatically</h4>
              <div className="rounded-xl border border-border/30 bg-secondary/5 p-4 space-y-3.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold bg-purple-500/10 text-purple-500 border border-purple-500/25 px-1.5 py-0.5 rounded">POST</span>
                  <code className="text-[12px] font-black text-foreground">{`${origin}/db/create`}</code>
                </div>
                <p className="text-[11.5px] text-muted-foreground leading-relaxed">
                  Creates a new database node. The body must contain `data` (which can be a JSON object or raw text string). You can optionally send `title` and `url`.
                </p>
              </div>

              {/* Code Examples for POST */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="rounded-xl border border-border/30 bg-secondary/15 p-4 space-y-2.5">
                  <div className="flex items-center gap-2 text-purple-400">
                    <Code2 className="size-4" />
                    <span className="text-[12px] font-black">JavaScript Fetch (POST)</span>
                  </div>
                  <pre className="text-[10.5px] font-mono leading-relaxed bg-[#0b0b0e] p-3 rounded-lg border border-border/10 text-emerald-400 overflow-x-auto text-left">
{`fetch("${origin}/db/create", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    title: "userProfile",
    url: "https://mywebsite.com",
    data: {
      theme: "dark",
      notifications: true
    }
  })
})
.then(res => res.json())
.then(result => {
  console.log("DB Key:", result.key);
  console.log("API URL:", result.url);
});`}
                  </pre>
                </div>

                <div className="rounded-xl border border-border/30 bg-secondary/15 p-4 space-y-2.5">
                  <div className="flex items-center gap-2 text-purple-400">
                    <Terminal className="size-4" />
                    <span className="text-[12px] font-black">cURL (POST)</span>
                  </div>
                  <pre className="text-[10.5px] font-mono leading-relaxed bg-[#0b0b0e] p-3 rounded-lg border border-border/10 text-emerald-400 overflow-x-auto">
{`curl -X POST \\
  "${origin}/db/create" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "myConfig",
    "url": "https://example.com",
    "data": {"status": "active"}
  }'`}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Create key */}
        {activeTab === "create" && (
          <div className="space-y-4 animate-slide-up text-left">
            <div className="space-y-1">
              <h3 className="text-[18px] font-black tracking-tight text-purple-400">Create Data Node</h3>
              <p className="text-[12.5px] text-muted-foreground">Publish JSON payloads directly to ssDB and get an edge API endpoint instantly.</p>
            </div>

            {error && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 text-destructive text-[12.5px] font-bold p-3 text-center">
                {error}
              </div>
            )}

            {dbKey ? (
              <div className="rounded-xl border border-purple-500/25 bg-purple-500/5 p-5 space-y-4 animate-spring-scale">
                <div className="text-center">
                  <span className="text-[10px] font-black uppercase text-green-500 tracking-wider">Node Published Successfully</span>
                  <h4 className="text-[13.5px] font-black text-muted-foreground mt-1">Node Key: {dbKey}</h4>
                </div>

                <div className="space-y-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Database API Endpoint</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={getDbUrl(dbKey)}
                        className="flex-1 h-10 bg-secondary/40 border border-border/30 rounded-xl px-3.5 text-[12px] font-bold text-muted-foreground outline-none min-w-0"
                      />
                      <button
                        onClick={() => copyText(getDbUrl(dbKey), "url")}
                        className="h-10 px-3.5 rounded-xl bg-foreground text-background font-bold text-[12px] flex items-center gap-1.5 flex-shrink-0"
                      >
                        {copiedUrl ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                        <span>Copy</span>
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setDbKey(null)}
                  className="w-full h-10 rounded-xl border border-border hover:bg-secondary/40 text-[12.5px] font-bold transition-colors"
                >
                  Create Another Node
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateNode} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10.5px] font-black uppercase text-muted-foreground tracking-wider">Node Title (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. userConfig..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full h-11 bg-background border border-border/40 rounded-xl px-4 text-[13px] font-bold text-foreground outline-none focus:border-purple-500/50 transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10.5px] font-black uppercase text-muted-foreground tracking-wider">Associated URL / Redirect (Optional)</label>
                    <input
                      type="url"
                      placeholder="https://example.com/redirect..."
                      value={associatedUrl}
                      onChange={(e) => setAssociatedUrl(e.target.value)}
                      className="w-full h-11 bg-background border border-border/40 rounded-xl px-4 text-[13px] font-bold text-foreground outline-none focus:border-purple-500/50 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10.5px] font-black uppercase text-muted-foreground tracking-wider font-sans">Payload (JSON or Text)</label>
                  <textarea
                    rows={8}
                    required
                    value={payload}
                    onChange={(e) => setPayload(e.target.value)}
                    className="w-full bg-background border border-border/40 rounded-[18px] p-4 text-[13px] font-mono text-foreground outline-none focus:border-purple-500/50 transition-colors resize-y leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full h-11 rounded-xl bg-foreground text-background font-black text-[13px] hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-40"
                >
                  {busy ? "Publishing to edge..." : "Publish Data Node"}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Tab 3: API Playground */}
        {activeTab === "play" && (
          <div className="space-y-5 animate-slide-up text-left">
            <div className="space-y-1">
              <h3 className="text-[18px] font-black tracking-tight text-purple-400">API Playground</h3>
              <p className="text-[12.5px] text-muted-foreground">Test ssDB keys and immediately preview the live parsed API response.</p>
            </div>

            <form onSubmit={handlePlaygroundFetch} className="flex gap-2">
              <input
                type="text"
                required
                placeholder="Enter node key (e.g. bYtZpdQ)..."
                value={searchKey}
                onChange={(e) => setSearchKey(e.target.value)}
                className="flex-1 h-11 bg-background border border-border/40 rounded-xl px-4 text-[13px] font-bold text-foreground outline-none focus:border-purple-500/50 transition-colors"
              />
              <button
                type="submit"
                disabled={fetching}
                className="h-11 px-5 rounded-xl bg-purple-600 text-white font-black text-[13px] flex items-center gap-1.5 hover:bg-purple-500 disabled:opacity-40"
              >
                {fetching ? "Fetching..." : (
                  <>
                    <Send className="size-4" />
                    <span>Query</span>
                  </>
                )}
              </button>
            </form>

            {playError && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 text-destructive text-[12.5px] font-bold p-3.5 text-center">
                {playError}
              </div>
            )}

            {playResult && (
              <div className="space-y-2 animate-spring-scale">
                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">JSON Response Header</span>
                <pre className="text-[11.5px] font-mono leading-relaxed bg-[#0b0b0e] p-4 rounded-xl border border-border/40 text-emerald-400 overflow-x-auto max-h-[340px] shadow-inner">
                  {playResult}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
