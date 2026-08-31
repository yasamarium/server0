import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import {
  Link2,
  Plus,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  Loader2,
  AlertCircle,
  ArrowLeft,
  MousePointerClick,
  Clock,
} from "lucide-react";
import { trackGlobalActivity } from "../lib/activity";

interface ShortLink {
  slug: string;
  url: string;
  createdBy: string;
  createdAt: string;
  clicks: number;
}

function LinksPage() {
  const [links, setLinks] = useState<ShortLink[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [slug, setSlug] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem("cloud_user_account");
      if (stored) {
        const acc = JSON.parse(stored);
        if (acc?.id) setUserId(acc.id);
      }
    } catch {}
  }, []);

  const fetchLinks = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/links/manage?userId=${encodeURIComponent(userId)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.links)) {
        setLinks(data.links);
      }
    } catch {}
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (userId) fetchLinks();
  }, [userId, fetchLinks]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug.trim() || !url.trim()) {
      setError("Both slug and URL are required.");
      return;
    }
    setCreating(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/links/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: slug.trim(),
          url: url.trim(),
          createdBy: userId || "anonymous",
        }),
      });
      const data = await res.json();
      if (data.success) {
        const domain = window.location.origin;
        setSuccess(`${domain}/${data.link.slug}`);
        trackGlobalActivity("Generated Short Link", `/${data.link.slug} → ${url.trim()}`);
        setSlug("");
        setUrl("");
        fetchLinks();
      } else {
        setError(data.error || "Failed to create link.");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setCreating(false);
  };

  const handleDelete = async (linkSlug: string) => {
    if (!userId) return;
    try {
      const res = await fetch("/api/links/manage", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: linkSlug, userId }),
      });
      const data = await res.json();
      if (data.success) {
        setLinks((prev) => prev.filter((l) => l.slug !== linkSlug));
      }
    } catch {}
  };

  const copyLink = (linkSlug: string) => {
    const domain = window.location.origin;
    navigator.clipboard.writeText(`${domain}/${linkSlug}`);
    setCopiedSlug(linkSlug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <main className="min-h-screen bg-background text-foreground font-sans relative">
      {/* Background Orbs */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8 relative z-10">
        {/* Header */}
        <div className="flex items-center gap-4">
          <a
            href="/"
            className="size-10 rounded-2xl bg-secondary/30 border border-border/40 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all"
          >
            <ArrowLeft className="size-4.5" />
          </a>
          <div className="flex-1">
            <h1 className="text-[26px] font-black tracking-tight leading-tight bg-gradient-to-r from-foreground via-orange-400 to-foreground bg-clip-text text-transparent">
              Link Shortener
            </h1>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              Create custom short links with your own slugs
            </p>
          </div>
          <div className="size-12 rounded-2xl bg-gradient-to-tr from-orange-500/20 to-amber-500/20 border border-orange-500/30 flex items-center justify-center">
            <Link2 className="size-5.5 text-orange-400" />
          </div>
        </div>

        {/* Create Link Form */}
        <div className="p-5 rounded-[24px] bg-secondary/10 border border-border/40 ios-glass space-y-4">
          <div className="flex items-center gap-2 text-foreground font-black text-[14px]">
            <Plus className="size-4 text-orange-400" />
            <span>Create New Link</span>
          </div>

          <form onSubmit={handleCreate} className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Custom Slug
              </label>
              <div className="flex items-center gap-0 rounded-xl border border-border/50 bg-background/80 overflow-hidden">
                <span className="px-3 py-2.5 text-[12px] text-muted-foreground bg-secondary/30 border-r border-border/30 font-mono whitespace-nowrap select-all">
                  {baseUrl}/
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""))}
                  placeholder="my-link"
                  maxLength={48}
                  className="flex-1 px-3 py-2.5 bg-transparent text-[13px] font-semibold text-foreground placeholder:text-muted-foreground/40 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Destination URL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/very-long-url"
                className="w-full px-3.5 py-2.5 rounded-xl border border-border/50 bg-background/80 text-[13px] font-semibold text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-orange-500/50 transition-colors"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[11.5px] font-semibold">
                <AlertCircle className="size-3.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11.5px] font-semibold">
                <Check className="size-3.5 flex-shrink-0" />
                <span className="flex-1 truncate font-mono">{success}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(success);
                    setCopiedSlug("__success");
                    setTimeout(() => setCopiedSlug(null), 2000);
                  }}
                  className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-bold transition-colors"
                >
                  {copiedSlug === "__success" ? "Copied!" : "Copy"}
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={creating || !slug.trim() || !url.trim()}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-[12.5px] font-black flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-orange-600/20"
            >
              {creating ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Link2 className="size-3.5" />
                  <span>Create Short Link</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* My Links */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-foreground font-black text-[14px]">
              <ExternalLink className="size-4 text-orange-400" />
              <span>My Links</span>
            </div>
            {loading && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
          </div>

          {!userId ? (
            <div className="p-6 rounded-[20px] bg-secondary/10 border border-border/30 text-center space-y-2">
              <p className="text-[12.5px] text-muted-foreground font-semibold">
                Login with your Cloud Account to manage your links.
              </p>
              <a
                href="/"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-600/20 border border-orange-500/30 text-orange-400 text-[11.5px] font-bold hover:bg-orange-600/30 transition-colors"
              >
                Go to Dashboard
              </a>
            </div>
          ) : links.length === 0 && !loading ? (
            <div className="p-6 rounded-[20px] bg-secondary/10 border border-border/30 text-center">
              <p className="text-[12.5px] text-muted-foreground/60 italic">
                No links created yet. Create your first short link above.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {links.map((link) => (
                <div
                  key={link.slug}
                  className="group p-4 rounded-[20px] bg-secondary/10 border border-border/30 hover:border-orange-500/30 transition-all space-y-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-black text-orange-400 font-mono truncate">
                          /{link.slug}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5 font-mono">
                        → {link.url}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => copyLink(link.slug)}
                        className="size-8 rounded-xl bg-background/60 border border-border/30 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-orange-500/30 transition-all"
                        title="Copy link"
                      >
                        {copiedSlug === link.slug ? (
                          <Check className="size-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="size-3.5" />
                        )}
                      </button>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="size-8 rounded-xl bg-background/60 border border-border/30 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-orange-500/30 transition-all"
                        title="Open destination"
                      >
                        <ExternalLink className="size-3.5" />
                      </a>
                      <button
                        onClick={() => handleDelete(link.slug)}
                        className="size-8 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-all"
                        title="Delete"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-[10px] text-muted-foreground/60 font-semibold">
                    <span className="flex items-center gap-1">
                      <MousePointerClick className="size-3" />
                      {link.clicks || 0} clicks
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {new Date(link.createdAt).toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export const Route = createFileRoute("/links")({
  component: LinksPage,
  head: () => ({
    meta: [
      { title: "Link Shortener — Cloud OS Space" },
      { name: "description", content: "Create custom short links with your own slugs. Like Bitly, but on your own domain." },
    ],
  }),
});
