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

export function ShsDbConsole() {
  // Publisher state
  const [title, setTitle] = useState("");
  const [associatedUrl, setAssociatedUrl] = useState("");
  const [payload, setPayload] = useState("{\n  \"status\": \"success\",\n  \"message\": \"Hello from shsDB\"\n}");
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
    let parsedData = cleanPayload;
    try {
      parsedData = JSON.parse(cleanPayload);
    } catch {
      if (!confirm("Payload does not appear to be valid JSON. Do you still want to save it as raw text?")) {
        return;
      }
    }

    setBusy(true);
    try {
      const response = await fetch("/shsdb/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: title.trim() || "shsDB Node",
          url: associatedUrl.trim(),
          data: parsedData
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setDbKey(data.key);
        setTitle("");
        setAssociatedUrl("");
        setPayload("{\n  \n}");
      } else {
        throw new Error(data.error || "Server rejected request");
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
      const res = await fetch(`/shsdb/${key}`);
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
    return `${origin}/shsdb/${key}`;
  };

  return (
    <div className="w-full flex flex-col md:flex-row gap-6 md:gap-8 items-start select-text text-left">
      
      {/* Sidebar: Navigation tabs */}
      <div className="w-full md:w-56 flex md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none flex-shrink-0 select-none">
        <button
          onClick={() => setActiveTab("docs")}
          className={`flex items-center gap-3 px-4 py-3.5 rounded-[16px] border font-bold text-[13.5px] whitespace-nowrap transition-all w-full ${
            activeTab === "docs"
              ? "bg-violet-600 text-white border-violet-500 shadow-md shadow-violet-500/10"
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
              ? "bg-violet-600 text-white border-violet-500 shadow-md shadow-violet-500/10"
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
              ? "bg-violet-600 text-white border-violet-500 shadow-md shadow-violet-500/10"
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
              <h3 className="text-[20px] font-black tracking-tight text-violet-400 flex items-center gap-2">
                <Database className="size-5.5" />
                <span>shsDB Engine API</span>
              </h3>
              <p className="text-[13px] text-muted-foreground leading-relaxed">
                shsDB is an ultra-fast, serverless JSON store built on top of our anonymous edge storage engine backed by <code className="text-violet-400">SHS Cloud</code>. You can dynamically create, publish, and fetch data nodes directly via REST endpoints with full CORS headers.
              </p>
            </div>

            {/* GET Node */}
            <div className="space-y-3.5 border-t border-border/30 pt-4">
              <h4 className="text-[14px] font-black text-foreground">1. Retrieve Data Node</h4>
              <div className="rounded-xl border border-border/30 bg-secondary/5 p-4 space-y-3.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold bg-green-500/10 text-green-500 border border-green-500/25 px-1.5 py-0.5 rounded">GET</span>
                  <code className="text-[12px] font-black text-foreground">{`${origin}/shsdb/<unique_key>`}</code>
                </div>
                <p className="text-[11.5px] text-muted-foreground leading-relaxed">
                  Fetches the database record containing metadata (title, associated url, payload type, character/word count) and the raw or parsed JSON data.
                </p>
              </div>

              {/* Code Examples for GET */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="rounded-xl border border-border/30 bg-secondary/15 p-4 space-y-2.5">
                  <div className="flex items-center gap-2 text-violet-400">
                    <Code2 className="size-4" />
                    <span className="text-[12px] font-black">JavaScript Fetch (GET)</span>
                  </div>
                  <pre className="text-[10.5px] font-mono leading-relaxed bg-[#0b0b0e] p-3 rounded-lg border border-border/10 text-emerald-400 overflow-x-auto">
{`fetch("${origin}/shsdb/demo-key")
  .then(res => res.json())
  .then(json => {
    console.log("Title:", json.title);
    console.log("Associated URL:", json.url);
    console.log("Payload:", json.data);
  });`}
                  </pre>
                </div>

                <div className="rounded-xl border border-border/30 bg-secondary/15 p-4 space-y-2.5">
                  <div className="flex items-center gap-2 text-violet-400">
                    <Terminal className="size-4" />
                    <span className="text-[12px] font-black">cURL (GET)</span>
                  </div>
                  <pre className="text-[10.5px] font-mono leading-relaxed bg-[#0b0b0e] p-3 rounded-lg border border-border/10 text-emerald-400 overflow-x-auto">
{`curl -X GET \\
  "${origin}/shsdb/demo-key"`}
                  </pre>
                </div>
              </div>
            </div>

            {/* POST Create */}
            <div className="space-y-3.5 border-t border-border/30 pt-4">
              <h4 className="text-[14px] font-black text-foreground">2. Create Data Node Programmatically</h4>
              <div className="rounded-xl border border-border/30 bg-secondary/5 p-4 space-y-3.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold bg-violet-500/10 text-violet-500 border border-violet-500/25 px-1.5 py-0.5 rounded">POST</span>
                  <code className="text-[12px] font-black text-foreground">{`${origin}/shsdb/create`}</code>
                </div>
                <p className="text-[11.5px] text-muted-foreground leading-relaxed">
                  Creates a new database node on SHS Cloud. The body must contain `data` (which can be a JSON object or raw text string). You can optionally send `title` and `url`.
                </p>
              </div>

              {/* Code Examples for POST */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="rounded-xl border border-border/30 bg-secondary/15 p-4 space-y-2.5">
                  <div className="flex items-center gap-2 text-violet-400">
                    <Code2 className="size-4" />
                    <span className="text-[12px] font-black">JavaScript Fetch (POST)</span>
                  </div>
                  <pre className="text-[10.5px] font-mono leading-relaxed bg-[#0b0b0e] p-3 rounded-lg border border-border/10 text-emerald-400 overflow-x-auto text-left">
{`fetch("${origin}/shsdb/create", {
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
                  <div className="flex items-center gap-2 text-violet-400">
                    <Terminal className="size-4" />
                    <span className="text-[12px] font-black">cURL (POST)</span>
                  </div>
                  <pre className="text-[10.5px] font-mono leading-relaxed bg-[#0b0b0e] p-3 rounded-lg border border-border/10 text-emerald-400 overflow-x-auto">
{`curl -X POST \\
  "${origin}/shsdb/create" \\
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
              <h3 className="text-[18px] font-black tracking-tight text-violet-400">Create Data Node</h3>
              <p className="text-[12.5px] text-muted-foreground">Publish JSON payloads directly to shsDB and get an edge API endpoint instantly.</p>
            </div>

            {error && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 text-destructive text-[12.5px] font-bold p-3 text-center">
                {error}
              </div>
            )}

            {dbKey ? (
              <div className="rounded-xl border border-violet-500/25 bg-violet-500/5 p-5 space-y-4 animate-spring-scale">
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
                        className="h-10 px-4 rounded-xl border border-border/30 hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground font-black text-[12px] flex-shrink-0"
                      >
                        {copiedUrl ? <Check className="size-4 text-green-500" /> : <Copy className="size-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Raw Key</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        readOnly
                        value={dbKey}
                        className="flex-1 h-10 bg-secondary/40 border border-border/30 rounded-xl px-3.5 text-[12px] font-bold text-muted-foreground outline-none min-w-0"
                      />
                      <button
                        onClick={() => copyText(dbKey, "key")}
                        className="h-10 px-4 rounded-xl border border-border/30 hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground font-black text-[12px] flex-shrink-0"
                      >
                        {copiedKey ? <Check className="size-4 text-green-500" /> : <Copy className="size-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setDbKey(null)}
                  className="w-full h-11 rounded-xl bg-violet-600 text-white font-black text-[13px] hover:bg-violet-500 transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="size-4" />
                  <span>Create Another Node</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateNode} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10.5px] font-black uppercase text-muted-foreground tracking-wider">Node Title (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. userProfile"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full h-11 bg-background border border-border/30 rounded-xl px-3.5 text-[13px] font-bold outline-none focus:border-violet-500/50 transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10.5px] font-black uppercase text-muted-foreground tracking-wider">Associated URL (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. https://website.com"
                      value={associatedUrl}
                      onChange={(e) => setAssociatedUrl(e.target.value)}
                      className="w-full h-11 bg-background border border-border/30 rounded-xl px-3.5 text-[13px] font-bold outline-none focus:border-violet-500/50 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10.5px] font-black uppercase text-muted-foreground tracking-wider">JSON / Plain Text Payload</label>
                  <textarea
                    placeholder="Enter JSON payload or text data to store..."
                    rows={8}
                    value={payload}
                    onChange={(e) => setPayload(e.target.value)}
                    className="w-full bg-background border border-border/30 rounded-xl p-3.5 text-[12.5px] font-mono outline-none focus:border-violet-500/50 transition-all resize-y"
                  />
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full h-11 rounded-xl bg-violet-600 text-white font-black text-[13px] hover:bg-violet-500 disabled:opacity-40 transition-all flex items-center justify-center gap-2 select-none"
                >
                  <Send className="size-4" />
                  <span>{busy ? "Publishing to SHS Cloud..." : "Create Edge Data Node"}</span>
                </button>
              </form>
            )}
          </div>
        )}

        {/* Tab 3: Playground */}
        {activeTab === "play" && (
          <div className="space-y-4 animate-slide-up text-left">
            <div className="space-y-1">
              <h3 className="text-[18px] font-black tracking-tight text-violet-400">API Playground</h3>
              <p className="text-[12.5px] text-muted-foreground">Test retrieval of shsDB database keys in real-time.</p>
            </div>

            <form onSubmit={handlePlaygroundFetch} className="flex gap-2">
              <input
                type="text"
                placeholder="Enter shsDB Key (e.g. qXiwf)..."
                value={searchKey}
                onChange={(e) => setSearchKey(e.target.value)}
                className="flex-1 h-11 bg-background border border-border/30 rounded-xl px-3.5 text-[13px] font-bold outline-none focus:border-violet-500/50 transition-all"
              />
              <button
                type="submit"
                disabled={fetching || !searchKey.trim()}
                className="h-11 px-5 rounded-xl bg-violet-600 text-white font-black text-[13px] hover:bg-violet-500 disabled:opacity-40 transition-all flex items-center justify-center gap-2 flex-shrink-0"
              >
                <span>Fetch</span>
                <ArrowRight className="size-4" />
              </button>
            </form>

            {fetching && (
              <div className="py-8 text-center text-[12.5px] font-bold text-muted-foreground flex items-center justify-center gap-2">
                <span className="size-4 rounded-full border-2 border-t-transparent border-violet-500 animate-spin" />
                <span>Retrieving node data from edge storage...</span>
              </div>
            )}

            {playError && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 text-destructive text-[12.5px] font-bold p-3.5 text-center">
                {playError}
              </div>
            )}

            {playResult && (
              <div className="space-y-2 animate-spring-scale">
                <label className="text-[10px] font-black uppercase text-muted-foreground tracking-wider block">Returned JSON Payload</label>
                <pre className="text-[11.5px] font-mono leading-relaxed bg-[#0b0b0e] p-4 rounded-xl border border-border/10 text-emerald-400 overflow-x-auto max-h-[300px]">
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
