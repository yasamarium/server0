import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { lookupLink, incrementClicks } from "../lib/github-links";

const FILE_CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Range, Accept, Origin",
  "Access-Control-Max-Age": "86400",
};

// Filename must look like "name.ext" — no slashes, must contain a dot.
const FILENAME_RE = /^[A-Za-z0-9_.-]{1,128}\.[A-Za-z0-9]{1,12}$/;

async function streamFile(filename: string, method: "GET" | "HEAD", request: Request) {
  if (!filename || !FILENAME_RE.test(filename)) {
    return new Response("Not found", { status: 404, headers: FILE_CORS });
  }

  const upstreamHeaders = new Headers();
  const range = request.headers.get("Range");
  if (range) upstreamHeaders.set("Range", range);

  // Candidate URLs to check in order across all supported storage nodes
  const candidateUrls: string[] = [
    `https://files.catbox.moe/${filename}`,
    `https://litter.catbox.moe/${filename}`,
    `https://tmpfiles.org/dl/${filename}`,
    `https://h.uguu.se/${filename}`,
    `https://a.uguu.se/${filename}`,
  ];

  // If filename starts with a pixeldrain id like "xyz123_filename.ext" or has 8-char id
  if (filename.includes("_")) {
    const pId = filename.split("_")[0];
    if (pId && pId.length >= 6) {
      candidateUrls.unshift(`https://pixeldrain.com/api/file/${pId}`);
    }
  }

  let upstream: Response | null = null;
  for (const url of candidateUrls) {
    try {
      const r = await fetch(url, { method, headers: upstreamHeaders });
      if (r.ok || r.status === 206) {
        upstream = r;
        break;
      }
    } catch {
      /* continue */
    }
  }

  if (!upstream) {
    return new Response("Not found", { status: 404, headers: FILE_CORS });
  }

  const headers = new Headers(FILE_CORS);
  const passthrough = ["content-type", "content-length", "accept-ranges", "content-range", "last-modified", "etag"];
  for (const h of passthrough) {
    const v = upstream.headers.get(h);
    if (v) headers.set(h, v);
  }
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  headers.set("Content-Disposition", `inline; filename="${filename}"`);

  return new Response(method === "HEAD" ? null : upstream.body, {
    status: upstream.status,
    headers,
  });
}

async function handleRequest(filename: string, method: "GET" | "HEAD", request: Request) {
  // If it looks like a file (has a dot + extension), proxy it
  if (FILENAME_RE.test(filename)) {
    return streamFile(filename, method, request);
  }

  // Otherwise, try to look up as a short link redirect
  const slug = filename.trim().toLowerCase();
  if (slug && /^[a-zA-Z0-9_-]{2,48}$/.test(slug)) {
    try {
      const link = await lookupLink(slug);
      if (link) {
        // Fire-and-forget click increment
        incrementClicks(slug).catch(() => {});
        
        // Build a simple redirect HTML page with a brief animation
        const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="refresh" content="0;url=${link.url}">
  <title>Redirecting...</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      min-height: 100vh; display: flex; align-items: center; justify-content: center; 
      background: #0a0a0a; color: #fff; font-family: -apple-system, system-ui, sans-serif;
    }
    .wrap { text-align: center; animation: fadeIn 0.3s ease; }
    .spinner { width: 28px; height: 28px; border: 3px solid #333; border-top-color: #a855f7;
      border-radius: 50%; animation: spin 0.6s linear infinite; margin: 0 auto 16px; }
    p { font-size: 13px; color: #888; }
    a { color: #a855f7; text-decoration: none; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="spinner"></div>
    <p>Redirecting to <a href="${link.url}">${link.url.length > 50 ? link.url.slice(0, 50) + '...' : link.url}</a></p>
  </div>
  <script>window.location.href="${link.url}";</script>
</body>
</html>`;
        return new Response(html, {
          status: 200,
          headers: { "Content-Type": "text/html; charset=utf-8", ...FILE_CORS },
        });
      }
    } catch {}
  }

  return new Response("Not found", { status: 404, headers: FILE_CORS });
}

function FilenameClientComponent() {
  const { filename } = Route.useParams();
  const [error, setError] = useState(false);
  const [targetUrl, setTargetUrl] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !filename) return;
    const slug = filename.trim().toLowerCase();

    // If it's a file link (contains a dot), let browser navigate directly
    if (filename.includes(".")) {
      window.location.href = `/${filename}`;
      return;
    }

    // Lookup short link for client-side navigation
    lookupLink(slug)
      .then((link) => {
        if (link && link.url) {
          setTargetUrl(link.url);
          incrementClicks(slug).catch(() => {});
          window.location.href = link.url;
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true));
  }, [filename]);

  if (error) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4 font-sans select-none">
        <div className="text-center space-y-4 max-w-sm">
          <div className="size-16 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto text-red-400 font-black text-xl">
            404
          </div>
          <h2 className="text-xl font-black text-foreground">Link Not Found</h2>
          <p className="text-xs text-muted-foreground">The short link or file path you are trying to access does not exist or has expired.</p>
          <a
            href="/"
            className="inline-block px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-colors shadow-lg shadow-purple-600/20"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-4 font-sans select-none">
      <div className="text-center space-y-3">
        <div className="size-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-muted-foreground font-semibold">
          {targetUrl ? `Redirecting to ${targetUrl}...` : "Loading short link..."}
        </p>
      </div>
    </div>
  );
}

// Public masked file URL: /{filename}.{ext} — proxies the upstream provider.
// Also handles short link redirects for slugs without dots.
export const Route = createFileRoute("/$filename")({
  component: FilenameClientComponent,
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: FILE_CORS }),
      HEAD: async ({ params, request }) => handleRequest(params.filename, "HEAD", request),
      GET: async ({ params, request }) => handleRequest(params.filename, "GET", request),
    },
  },
});
