import { createFileRoute } from "@tanstack/react-router";
import { getFileInfo, scrapeDirectUrl } from "../../../lib/fi-resolver";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Range, Accept, Origin",
  "Access-Control-Max-Age": "86400",
};

export const Route = createFileRoute("/api/fi/download")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const fileId = url.searchParams.get("id");
        const wantRedirect = url.searchParams.get("redirect") !== "false";

        if (!fileId) {
          return Response.json({ success: false, error: "Missing id param" }, { status: 400, headers: CORS });
        }

        const cleanId = fileId.split("/")[0].trim();
        const info = await getFileInfo(cleanId);

        if (!info) {
          return Response.json({ success: false, error: "File not found or expired." }, { status: 404, headers: CORS });
        }

        // If redirect=false, return JSON info (used by viewer page)
        if (!wantRedirect) {
          return Response.json({
            success: true,
            id: info.id,
            filename: info.filename,
            readableSize: info.readableSize,
            size: info.size,
          }, { headers: CORS });
        }

        // Otherwise stream the file through our domain
        if (!info.directUrl) {
          return Response.json({ success: false, error: "Could not resolve download link." }, { status: 404, headers: CORS });
        }

        const upstream = await fetch(info.directUrl, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
        });

        if (!upstream.ok || !upstream.body) {
          return Response.json({ success: false, error: "Upstream file unavailable." }, { status: 502, headers: CORS });
        }

        const headers: Record<string, string> = { ...CORS };
        const ct = upstream.headers.get("content-type");
        const cd = upstream.headers.get("content-disposition");
        const cl = upstream.headers.get("content-length");
        if (ct) headers["Content-Type"] = ct;
        if (cd) headers["Content-Disposition"] = cd;
        if (cl) headers["Content-Length"] = cl;

        return new Response(upstream.body as any, { status: 200, headers });
      },
    },
  },
});
