import { createFileRoute } from "@tanstack/react-router";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
  "Content-Type": "application/json; charset=utf-8",
};

async function handleUpload(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return new Response(JSON.stringify({ success: false, error: "No file provided." }), {
        status: 400,
        headers: CORS,
      });
    }

    // Forward upload
    const upForm = new FormData();
    upForm.append("reqtype", "fileupload");
    upForm.append("time", "24h");
    upForm.append("fileToUpload", file);

    const upRes = await fetch("https://litterbox.catbox.moe/resources/internals/api.php", {
      method: "POST",
      body: upForm,
    });

    const url = (await upRes.text()).trim();

    if (url.startsWith("https://")) {
      return new Response(JSON.stringify({ success: true, url }), {
        status: 200,
        headers: CORS,
      });
    }

    return new Response(JSON.stringify({ success: false, error: "Upload failed." }), {
      status: 500,
      headers: CORS,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message || "Upload error." }), {
      status: 500,
      headers: CORS,
    });
  }
}

export const Route = createFileRoute("/api/chat/upload")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => handleUpload(request),
    },
  },
});
