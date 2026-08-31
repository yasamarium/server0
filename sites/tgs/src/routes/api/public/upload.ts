import { createFileRoute } from "@tanstack/react-router";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Accept, Origin",
  "Access-Control-Max-Age": "86400",
};

function getOrigin(request: Request) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  if (forwardedHost) return `${forwardedProto}://${forwardedHost}`;
  return new URL(request.url).origin;
}

// Forward File directly to upstream provider with multi-host fallback
async function uploadToBackend(file: any, retention: string, origin: string): Promise<{ filename: string; directUrl?: string }> {
  const filename = file.name || "upload";

  // Provider 1: Catbox (Permanent)
  if (retention !== "72h") {
    try {
      const fd = new FormData();
      fd.append("reqtype", "fileupload");
      fd.append("fileToUpload", file, filename);

      const res = await fetch("https://catbox.moe/user/api.php", {
        method: "POST",
        body: fd,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });
      const text = (await res.text()).trim();
      if (res.ok && text.startsWith("http")) {
        const name = text.split("/").pop();
        if (name) return { filename: name, directUrl: text };
      }
    } catch {
      /* fall through */
    }
  }

  // Provider 2: Tmpfiles (Permanent / Long-term)
  try {
    const fd = new FormData();
    fd.append("file", file, filename);

    const res = await fetch("https://tmpfiles.org/api/v1/upload", {
      method: "POST",
      body: fd,
    });
    if (res.ok) {
      const data = await res.json();
      if (data.status === "success" && data.data?.url) {
        const rawUrl = data.data.url;
        const dlUrl = rawUrl.replace("tmpfiles.org/", "tmpfiles.org/dl/");
        const name = dlUrl.split("/").pop() || filename;
        return { filename: name, directUrl: dlUrl };
      }
    }
  } catch {
    /* fall through */
  }

  // Provider 3: Pixeldrain
  try {
    const safeName = encodeURIComponent(filename);
    const arrayBuf = await file.arrayBuffer();
    const res = await fetch(`https://pixeldrain.com/api/file/${safeName}`, {
      method: "PUT",
      body: arrayBuf,
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.id) {
        const directUrl = `https://pixeldrain.com/api/file/${data.id}`;
        return { filename: `${data.id}_${filename}`, directUrl };
      }
    }
  } catch {
    /* fall through */
  }

  // Provider 4: Litterbox (72h temporary)
  try {
    const fd = new FormData();
    fd.append("reqtype", "fileupload");
    fd.append("time", "72h");
    fd.append("fileToUpload", file, filename);

    const res = await fetch("https://litterbox.catbox.moe/resources/internals/api.php", {
      method: "POST",
      body: fd,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    const text = (await res.text()).trim();
    if (res.ok && text.startsWith("http")) {
      const name = text.split("/").pop();
      if (name) return { filename: name, directUrl: text };
    }
  } catch {
    /* fall through */
  }

  // Provider 5: Uguu.se
  try {
    const fd = new FormData();
    fd.append("files[]", file, filename);

    const res = await fetch("https://uguu.se/upload.php", {
      method: "POST",
      body: fd,
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.files?.[0]?.url) {
        const uUrl = data.files[0].url;
        const name = uUrl.split("/").pop() || filename;
        return { filename: name, directUrl: uUrl };
      }
    }
  } catch {
    /* fall through */
  }

  throw new Error("All upload storage backends are temporarily busy. Please try again.");
}

export const Route = createFileRoute("/api/public/upload")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        try {
          const incoming = await request.formData();
          const file = incoming.get("file");
          const retention = incoming.get("retention")?.toString() || "permanent";

          if (!file || typeof (file as any).arrayBuffer !== "function") {
            return Response.json(
              { success: false, error: "No file provided" },
              { status: 400, headers: CORS },
            );
          }

          const origin = getOrigin(request);
          const { filename, directUrl } = await uploadToBackend(file, retention, origin);
          
          // Use direct URL or masked URL
          const maskedUrl = directUrl || `${origin}/${filename}`;

          return Response.json(
            {
              success: true,
              url: maskedUrl,
              directUrl: directUrl || maskedUrl,
              filename,
              size: (file as any).size,
              type: (file as any).type,
            },
            { headers: CORS },
          );
        } catch (err) {
          return Response.json(
            { success: false, error: (err as Error).message },
            { status: 500, headers: CORS },
          );
        }
      },
    },
  },
});