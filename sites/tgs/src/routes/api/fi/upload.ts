import { createFileRoute } from "@tanstack/react-router";
import { uploadFile } from "../../../lib/fi-resolver";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Accept, Origin",
  "Access-Control-Max-Age": "86400",
};

function getOrigin(request: Request) {
  const fh = request.headers.get("x-forwarded-host");
  const fp = request.headers.get("x-forwarded-proto") ?? "https";
  if (fh) return `${fp}://${fh}`;
  return new URL(request.url).origin;
}

export const Route = createFileRoute("/api/fi/upload")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        try {
          const form = await request.formData();
          const file = form.get("file") as any;
          const expire = parseInt(form.get("expire")?.toString() || "0", 10) || 0;

          if (!file || typeof file.arrayBuffer !== "function") {
            return Response.json({ success: false, error: "No file provided" }, { status: 400, headers: CORS });
          }

          const buf = await file.arrayBuffer();
          const origin = getOrigin(request);
          const result = await uploadFile(buf, file.name || "upload", expire);

          if (!result.success || !result.id) {
            return Response.json({ success: false, error: result.error || "Upload failed" }, { status: 500, headers: CORS });
          }

          return Response.json({
            success: true,
            id: result.id,
            filename: result.filename,
            size: result.size || file.size,
            readableSize: result.readableSize,
            url: `${origin}/fi/${result.id}`,
            directDownloadUrl: `${origin}/fi/${result.id}/download`,
            directUrl: result.directUrl,
          }, { headers: CORS });
        } catch (err: any) {
          return Response.json({ success: false, error: err.message || "Internal server error" }, { status: 500, headers: CORS });
        }
      },
    },
  },
});
