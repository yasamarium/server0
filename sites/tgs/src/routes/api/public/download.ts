import { createFileRoute } from "@tanstack/react-router";

async function handleFileDownload(request: Request) {
  try {
    const reqUrl = new URL(request.url);
    const targetUrl = reqUrl.searchParams.get("url");
    const rawFileName = reqUrl.searchParams.get("name") || "download";

    if (!targetUrl) {
      return new Response("Missing 'url' parameter", { status: 400 });
    }

    // Clean filename and escape non-ascii for header
    const cleanFileName = rawFileName.replace(/["\r\n]/g, "_").trim();
    const encodedFileName = encodeURIComponent(cleanFileName);

    const upstreamRes = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!upstreamRes.ok || !upstreamRes.body) {
      return new Response(`Failed to fetch remote file (${upstreamRes.status})`, { status: upstreamRes.status });
    }

    const contentType = upstreamRes.headers.get("content-type") || "application/octet-stream";
    const contentLength = upstreamRes.headers.get("content-length");

    const headers: Record<string, string> = {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${cleanFileName}"; filename*=UTF-8''${encodedFileName}`,
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=86400",
    };

    if (contentLength) {
      headers["Content-Length"] = contentLength;
    }

    return new Response(upstreamRes.body, {
      status: 200,
      headers,
    });
  } catch (err: any) {
    return new Response(err.message || "Failed to download file", { status: 500 });
  }
}

export const Route = createFileRoute("/api/public/download")({
  server: {
    handlers: {
      GET: async ({ request }) => handleFileDownload(request),
    },
  },
});
