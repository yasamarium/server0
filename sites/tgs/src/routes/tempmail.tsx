import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useRef, useCallback } from "react";
import {
  Mail,
  RefreshCw,
  Copy,
  Check,
  Trash2,
  Inbox,
  ArrowLeft,
  Sun,
  Moon,
  Loader2,
  Clock,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  Edit3,
  CheckCheck
} from "lucide-react";

export const Route = createFileRoute("/tempmail")({
  head: () => ({
    meta: [
      { title: "Temp Mail — Fast & Anonymous Disposable Inbox" },
      {
        name: "description",
        content:
          "Generate temporary, anonymous email addresses to bypass spam. Real-time inbox for verification codes and signups.",
      },
    ],
  }),
  component: TempMailPage,
});

interface GuerrillaMessageItem {
  mail_id: number | string;
  mail_from: string;
  mail_subject: string;
  mail_excerpt: string;
  mail_body?: string;
  mail_date: string;
  mail_read: number;
  mail_timestamp?: number;
}

interface FullMessageDetail {
  id: string;
  from: string;
  subject: string;
  body: string;
  date: string;
}

export function TempMailPage() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  // Account state
  const [emailAddress, setEmailAddress] = useState<string>("");
  const [sidToken, setSidToken] = useState<string>("");

  // Loading & Error states
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Custom address edit state
  const [isEditingUser, setIsEditingUser] = useState<boolean>(false);
  const [customUsername, setCustomUsername] = useState<string>("");
  const [customLoading, setCustomLoading] = useState<boolean>(false);

  // Inbox states
  const [messages, setMessages] = useState<GuerrillaMessageItem[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<FullMessageDetail | null>(null);
  const [messageLoading, setMessageLoading] = useState<boolean>(false);

  // UI indicators
  const [copied, setCopied] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [lastChecked, setLastChecked] = useState<string>("");
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync theme
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

  // Fetch or create account
  const initAccount = useCallback(async (existingToken?: string) => {
    setLoading(true);
    setError(null);
    setSelectedMessage(null);

    try {
      let url = "https://api.guerrillamail.com/ajax.php?f=get_email_address";
      if (existingToken) {
        url += `&sid_token=${encodeURIComponent(existingToken)}`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error(`Mail server returned error (${res.status})`);

      const data = await res.json();
      if (!data.email_addr || !data.sid_token) {
        throw new Error("Unable to obtain disposable email address.");
      }

      setEmailAddress(data.email_addr);
      setSidToken(data.sid_token);
      localStorage.setItem("gm_tempmail_address", data.email_addr);
      localStorage.setItem("gm_tempmail_token", data.sid_token);

      // Immediately fetch messages with this token
      await checkMessages(data.sid_token);
    } catch (err: any) {
      setError(err.message || "Failed to initialize temp mail service.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Check inbox messages
  const checkMessages = async (token: string, silent = false) => {
    if (!token) return;
    if (!silent) setRefreshing(true);

    try {
      const res = await fetch(
        `https://api.guerrillamail.com/ajax.php?f=check_email&seq=0&sid_token=${encodeURIComponent(token)}`
      );
      if (!res.ok) throw new Error("Failed to load inbox.");

      const data = await res.json();
      if (data.list && Array.isArray(data.list)) {
        setMessages(data.list);
      }
      setLastChecked(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } catch (err) {
      console.error("Inbox fetch error:", err);
    } finally {
      if (!silent) setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    const savedToken = localStorage.getItem("gm_tempmail_token");
    initAccount(savedToken || undefined);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [initAccount]);

  // Auto-polling interval
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (autoRefresh && sidToken) {
      timerRef.current = setInterval(() => {
        checkMessages(sidToken, true);
      }, 7000); // Poll every 7 seconds
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoRefresh, sidToken]);

  // Generate new random address
  const handleGenerateNew = async () => {
    if (sidToken) {
      try {
        await fetch(`https://api.guerrillamail.com/ajax.php?f=forget_me&sid_token=${encodeURIComponent(sidToken)}`);
      } catch {}
    }
    localStorage.removeItem("gm_tempmail_address");
    localStorage.removeItem("gm_tempmail_token");
    setMessages([]);
    setSelectedMessage(null);
    initAccount();
  };

  // Set custom email username
  const handleSetCustomUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = customUsername.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, "");
    if (!cleanUser || !sidToken) return;

    setCustomLoading(true);
    try {
      const res = await fetch(
        `https://api.guerrillamail.com/ajax.php?f=set_email_user&email_user=${encodeURIComponent(cleanUser)}&sid_token=${encodeURIComponent(sidToken)}`
      );
      if (!res.ok) throw new Error("Failed to update email address.");

      const data = await res.json();
      if (data.email_addr) {
        setEmailAddress(data.email_addr);
        localStorage.setItem("gm_tempmail_address", data.email_addr);
        setIsEditingUser(false);
        setCustomUsername("");
        await checkMessages(sidToken);
      }
    } catch (err: any) {
      alert(err.message || "Failed to set custom email username.");
    } finally {
      setCustomLoading(false);
    }
  };

  // Read single email
  const readMessage = async (msg: GuerrillaMessageItem) => {
    if (!sidToken) return;
    setMessageLoading(true);

    try {
      const res = await fetch(
        `https://api.guerrillamail.com/ajax.php?f=fetch_email&email_id=${encodeURIComponent(msg.mail_id)}&sid_token=${encodeURIComponent(sidToken)}`
      );
      if (!res.ok) throw new Error("Failed to load message content.");

      const data = await res.json();
      setSelectedMessage({
        id: String(msg.mail_id),
        from: data.mail_from || msg.mail_from,
        subject: data.mail_subject || msg.mail_subject || "(No Subject)",
        body: data.mail_body || msg.mail_body || msg.mail_excerpt || "No content.",
        date: data.mail_date || msg.mail_date || "Just now",
      });

      // Mark locally as read
      setMessages((prev) =>
        prev.map((m) => (String(m.mail_id) === String(msg.mail_id) ? { ...m, mail_read: 1 } : m))
      );
    } catch (err: any) {
      alert(err.message || "Failed to open message.");
    } finally {
      setMessageLoading(false);
    }
  };

  // Delete message
  const deleteMessage = async (mailId: number | string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!sidToken) return;

    if (selectedMessage?.id === String(mailId)) {
      setSelectedMessage(null);
    }

    try {
      await fetch(
        `https://api.guerrillamail.com/ajax.php?f=del_email&email_ids[]=${encodeURIComponent(mailId)}&sid_token=${encodeURIComponent(sidToken)}`
      );
      setMessages((prev) => prev.filter((m) => String(m.mail_id) !== String(mailId)));
    } catch (err) {
      console.error("Delete email error:", err);
    }
  };

  const handleCopy = () => {
    if (!emailAddress) return;
    navigator.clipboard.writeText(emailAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="min-h-screen bg-background text-foreground font-sans transition-colors duration-300 flex flex-col h-screen overflow-hidden relative select-none">
      {/* Top Header */}
      <header className="px-5 py-3.5 flex items-center justify-between border-b border-border/40 backdrop-blur-md sticky top-0 z-40 bg-background/85 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="size-9 rounded-full border border-border/60 flex items-center justify-center hover:bg-secondary active:scale-95 transition-all text-foreground"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div className="flex items-center gap-2.5">
            <div className="size-8.5 rounded-xl bg-violet-600/15 border border-violet-500/30 flex items-center justify-center shadow-inner">
              <Mail className="size-4.5 text-violet-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[15.5px] font-black tracking-tight leading-tight">TEMP MAIL</h1>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-black text-emerald-500 tracking-wider uppercase">
                  Active
                </span>
              </div>
              <p className="text-[9.5px] text-muted-foreground font-bold uppercase tracking-wider">
                Anonymous Disposable Inbox
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="size-8.5 rounded-full border border-border/60 flex items-center justify-center hover:bg-secondary transition-all active:scale-95"
            title="Toggle theme"
          >
            {theme === "dark" ? <Sun className="size-4 text-amber-400" /> : <Moon className="size-4 text-zinc-700" />}
          </button>
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 bg-secondary/5">
        {/* Left Side: Address Control & Inbox List */}
        <div className="w-full md:w-[430px] border-r border-border/30 flex flex-col min-h-0 flex-shrink-0 bg-background/50">
          {/* Email Address Card Panel */}
          <div className="p-4 sm:p-5 border-b border-border/30 space-y-3.5 flex-shrink-0">
            {loading ? (
              <div className="py-5 flex flex-col items-center justify-center space-y-2">
                <Loader2 className="size-6 text-violet-500 animate-spin" />
                <span className="text-[11.5px] font-bold text-muted-foreground">Connecting temporary mailbox...</span>
              </div>
            ) : error ? (
              <div className="p-3.5 rounded-2xl border border-destructive/25 bg-destructive/5 space-y-2 text-center">
                <AlertCircle className="size-5 text-destructive mx-auto" />
                <p className="text-[12px] font-bold text-destructive">{error}</p>
                <button
                  onClick={() => initAccount()}
                  className="px-4 py-1.5 rounded-full bg-destructive text-white text-[11px] font-black hover:bg-destructive/80 transition-all"
                >
                  Retry Connection
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                    <Sparkles className="size-3 text-violet-500" />
                    <span>Your Disposable Address</span>
                  </span>
                  <button
                    onClick={() => setIsEditingUser(!isEditingUser)}
                    className="text-[10.5px] font-bold text-violet-500 hover:text-violet-400 flex items-center gap-1 transition-colors"
                  >
                    <Edit3 className="size-3" />
                    <span>{isEditingUser ? "Cancel" : "Custom Name"}</span>
                  </button>
                </div>

                {/* Custom Name Edit Form */}
                {isEditingUser ? (
                  <form onSubmit={handleSetCustomUsername} className="flex gap-2 animate-fade-in">
                    <input
                      type="text"
                      placeholder="e.g. myname123"
                      value={customUsername}
                      onChange={(e) => setCustomUsername(e.target.value)}
                      autoFocus
                      required
                      className="flex-1 h-11 bg-secondary/60 border border-violet-500/40 rounded-2xl px-3.5 text-[13px] font-bold text-foreground outline-none focus:ring-2 focus:ring-violet-500/20 select-text"
                    />
                    <button
                      type="submit"
                      disabled={customLoading || !customUsername.trim()}
                      className="px-4 h-11 rounded-2xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-xs font-black transition-all flex items-center gap-1 shadow-md"
                    >
                      {customLoading ? <Loader2 className="size-3.5 animate-spin" /> : <span>Set</span>}
                    </button>
                  </form>
                ) : (
                  /* Address Display Bar */
                  <div className="flex gap-2">
                    <div
                      onClick={handleCopy}
                      className="flex-1 h-12 bg-secondary/50 hover:bg-secondary/70 border border-border/50 rounded-2xl px-3.5 flex items-center justify-between font-mono font-bold text-[13px] sm:text-[13.5px] select-all overflow-x-auto scrollbar-none whitespace-nowrap cursor-pointer transition-colors shadow-inner"
                      title="Click to copy email address"
                    >
                      <span className="truncate">{emailAddress}</span>
                    </div>

                    <button
                      onClick={handleCopy}
                      className="size-12 rounded-2xl border border-border/50 bg-background hover:bg-secondary active:scale-95 transition-all text-muted-foreground hover:text-foreground flex items-center justify-center flex-shrink-0 shadow-sm"
                      title="Copy Address"
                    >
                      {copied ? <Check className="size-4.5 text-emerald-500" /> : <Copy className="size-4.5" />}
                    </button>
                  </div>
                )}

                {/* Actions & Refresh Bar */}
                <div className="flex items-center justify-between pt-0.5 select-none">
                  <button
                    onClick={handleGenerateNew}
                    className="flex items-center gap-1.5 text-[11px] font-black text-rose-500 hover:text-rose-400 active:scale-95 transition-all"
                  >
                    <Trash2 className="size-3.5" />
                    <span>New Random Address</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {/* Auto Refresh toggle */}
                    <button
                      onClick={() => setAutoRefresh(!autoRefresh)}
                      className={`h-6 px-2.5 rounded-full border text-[9px] font-black tracking-wider uppercase transition-all flex items-center gap-1 ${
                        autoRefresh
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                          : "border-border text-muted-foreground"
                      }`}
                      title={autoRefresh ? "Auto refreshing every 7 seconds" : "Auto refresh paused"}
                    >
                      <Clock className="size-2.5" />
                      <span>{autoRefresh ? "Auto" : "Paused"}</span>
                    </button>

                    <button
                      onClick={() => checkMessages(sidToken)}
                      disabled={refreshing}
                      className="size-7 rounded-full border border-border/50 flex items-center justify-center hover:bg-secondary active:scale-90 disabled:opacity-40 transition-all text-muted-foreground hover:text-foreground"
                      title="Refresh Inbox"
                    >
                      <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin text-violet-500" : ""}`} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Inbox Header Title */}
          <div className="px-4 py-2 bg-secondary/20 border-b border-border/20 flex items-center justify-between text-[11px] font-bold text-muted-foreground">
            <span>Inbox ({messages.length})</span>
            {lastChecked && <span className="text-[10px] font-mono text-muted-foreground/70">Updated: {lastChecked}</span>}
          </div>

          {/* Inbox Messages list */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 select-none space-y-3">
                <div className="size-13 rounded-full bg-violet-500/5 border border-violet-500/15 flex items-center justify-center">
                  <Inbox className="size-5.5 text-muted-foreground opacity-50" />
                </div>
                <div>
                  <p className="text-[13px] font-black text-foreground">Waiting for incoming emails...</p>
                  <p className="text-[11px] text-muted-foreground max-w-[240px] mx-auto mt-0.5 leading-relaxed font-normal">
                    This inbox refreshes automatically. Use this temporary address to receive OTPs, verification links, or signups.
                  </p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-border/20">
                {messages.map((msg) => {
                  const isSelected = selectedMessage?.id === String(msg.mail_id);
                  const isRead = msg.mail_read === 1;

                  return (
                    <div
                      key={msg.mail_id}
                      onClick={() => readMessage(msg)}
                      className={`p-3.5 sm:p-4 flex gap-3 cursor-pointer transition-all hover:bg-secondary/30 relative select-none ${
                        isSelected ? "bg-secondary/45 border-l-[3px] border-violet-500" : ""
                      } ${!isRead ? "bg-violet-500/[0.03]" : ""}`}
                    >
                      {/* Unread dot */}
                      {!isRead && <span className="absolute left-2 top-4 size-2 rounded-full bg-violet-500 animate-pulse" />}

                      <div className="flex-1 min-w-0 space-y-0.5 pl-1.5">
                        <div className="flex justify-between items-start gap-2">
                          <p className={`text-[12px] truncate ${!isRead ? "font-black text-foreground" : "font-bold text-muted-foreground"}`}>
                            {msg.mail_from}
                          </p>
                          <span className="text-[10px] text-muted-foreground font-mono flex-shrink-0">
                            {msg.mail_date}
                          </span>
                        </div>

                        <p className={`text-[12.5px] truncate ${!isRead ? "font-black text-foreground" : "font-bold text-foreground/80"}`}>
                          {msg.mail_subject || "(No Subject)"}
                        </p>

                        <p className="text-[11px] text-muted-foreground line-clamp-2 leading-tight">
                          {msg.mail_excerpt}
                        </p>
                      </div>

                      <button
                        onClick={(e) => deleteMessage(msg.mail_id, e)}
                        className="size-7 rounded-full hover:bg-rose-500/10 hover:text-rose-500 flex items-center justify-center text-muted-foreground/40 hover:text-rose-500 transition-all self-center flex-shrink-0"
                        title="Delete Email"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Message Detail Panel */}
        <div className="flex-1 flex flex-col min-h-0 bg-background relative">
          {messageLoading ? (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm space-y-2">
              <Loader2 className="size-7 text-violet-500 animate-spin" />
              <span className="text-[12px] font-bold text-muted-foreground">Opening message content...</span>
            </div>
          ) : selectedMessage ? (
            <div className="flex-1 flex flex-col min-h-0 select-text">
              {/* Message Header */}
              <div className="p-4 sm:p-5 border-b border-border/30 space-y-2.5 flex-shrink-0 bg-background/70 backdrop-blur-md">
                <div className="flex justify-between items-start gap-4">
                  <h2 className="text-[15.5px] sm:text-[17.5px] font-black tracking-tight leading-snug break-words">
                    {selectedMessage.subject}
                  </h2>
                  <span className="text-[10.5px] font-mono text-muted-foreground bg-secondary/50 px-2.5 py-1 rounded-full border border-border/40 whitespace-nowrap flex-shrink-0">
                    {selectedMessage.date}
                  </span>
                </div>

                <div className="space-y-1 text-[12px] font-bold">
                  <div className="flex gap-2">
                    <span className="text-muted-foreground w-12 flex-shrink-0">From:</span>
                    <span className="text-foreground truncate select-all">{selectedMessage.from}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-muted-foreground w-12 flex-shrink-0">To:</span>
                    <span className="text-foreground truncate select-all">{emailAddress}</span>
                  </div>
                </div>
              </div>

              {/* Message Body Viewport */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white dark:bg-[#0c0c11]">
                {selectedMessage.body.includes("<") && selectedMessage.body.includes(">") ? (
                  <iframe
                    srcDoc={`
                      <!DOCTYPE html>
                      <html>
                        <head>
                          <meta charset="utf-8">
                          <style>
                            body {
                              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                              font-size: 13.5px;
                              line-height: 1.6;
                              color: ${theme === "dark" ? "#e4e4e7" : "#18181b"};
                              background-color: ${theme === "dark" ? "#0c0c11" : "#ffffff"};
                              margin: 0;
                              padding: 12px;
                              word-break: break-word;
                            }
                            a { color: #8b5cf6; text-decoration: underline; }
                            img { max-width: 100%; height: auto; border-radius: 8px; }
                            pre { background: ${theme === "dark" ? "#18181b" : "#f4f4f5"}; padding: 12px; border-radius: 8px; overflow-x: auto; }
                          </style>
                        </head>
                        <body>
                          ${selectedMessage.body}
                        </body>
                      </html>
                    `}
                    className="w-full h-full border-0 bg-transparent rounded-lg"
                    sandbox="allow-popups allow-popups-to-escape-sandbox"
                    title="Email content"
                  />
                ) : (
                  <pre className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed text-foreground dark:text-zinc-200">
                    {selectedMessage.body}
                  </pre>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 select-none space-y-3 bg-secondary/[0.02]">
              <div className="size-15 rounded-2xl bg-violet-500/5 border border-violet-500/15 flex items-center justify-center shadow-sm">
                <Mail className="size-6 text-violet-500/40 animate-pulse" />
              </div>
              <div>
                <p className="text-[13.5px] font-black text-foreground">No email selected</p>
                <p className="text-[11px] text-muted-foreground max-w-[240px] mx-auto mt-0.5 leading-normal font-normal">
                  Select an incoming email from the list on the left to read its full body, verification codes, or links.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Status Banner */}
      <footer className="h-9 bg-background border-t border-border/40 flex-shrink-0 flex items-center justify-between px-4 select-none z-10 text-[10px]">
        <div className="flex items-center gap-1.5 text-muted-foreground font-semibold">
          <ShieldCheck className="size-3.5 text-emerald-500" />
          <span>Anonymous • 100% Free Disposable Mailbox</span>
        </div>
        <div className="flex items-center gap-1.5 text-violet-500 font-bold">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-ping" />
          <span>Guerrilla Mail Network Active</span>
        </div>
      </footer>
    </main>
  );
}
