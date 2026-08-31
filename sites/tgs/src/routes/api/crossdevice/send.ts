import { createFileRoute } from "@tanstack/react-router";
import { createClipboardItem } from "../../../lib/github-crossdevice";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
  "Content-Type": "application/json; charset=utf-8",
};

async function uploadMediaToCatbox(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("reqtype", "fileupload");
  fd.append("fileToUpload", file, file.name || "upload");

  const res = await fetch("https://catbox.moe/user/api.php", {
    method: "POST",
    body: fd,
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });

  const text = (await res.text()).trim();
  if (res.ok && text.startsWith("http")) {
    return text;
  }

  // Fallback to litterbox 72h
  const fd2 = new FormData();
  fd2.append("reqtype", "fileupload");
  fd2.append("time", "72h");
  fd2.append("fileToUpload", file, file.name || "upload");

  const res2 = await fetch("https://litterbox.catbox.moe/resources/internals/api.php", {
    method: "POST",
    body: fd2,
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });

  const text2 = (await res2.text()).trim();
  if (res2.ok && text2.startsWith("http")) {
    return text2;
  }

  throw new Error(text2 || `Media upload failed (${res2.status})`);
}

async function handleCrossDeviceSend(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";

    let itemType: "text" | "media" = "text";
    let textContent = "";
    let mediaUrl = "";
    let fileName = "";
    let fileSize = 0;
    let mimeType = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const textParam = (formData.get("text") as string) || "";
      const fileParam = formData.get("file") as File | null;

      if (textParam) textContent = textParam;

      if (fileParam && fileParam.size > 0) {
        itemType = "media";
        fileName = fileParam.name;
        fileSize = fileParam.size;
        mimeType = fileParam.type;
        mediaUrl = await uploadMediaToCatbox(fileParam);
      }
    } else {
      const body = (await request.json()) as any;
      if (body.text) textContent = body.text;
      if (body.mediaUrl) {
        itemType = "media";
        mediaUrl = body.mediaUrl;
        fileName = body.fileName || "Media File";
      }
    }

    if (!textContent.trim() && !mediaUrl) {
      return new Response(
        JSON.stringify({ success: false, error: "Please enter text or upload a media file." }),
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const saveRes = await createClipboardItem({
      type: itemType,
      text: textContent,
      mediaUrl: mediaUrl || undefined,
      fileName: fileName || undefined,
      fileSize: fileSize || undefined,
      mimeType: mimeType || undefined,
    });

    if (!saveRes.success || !saveRes.item) {
      return new Response(
        JSON.stringify({ success: false, error: saveRes.error || "Failed to save to database." }),
        { status: 500, headers: CORS_HEADERS }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        code: saveRes.item.code,
        item: saveRes.item,
      }),
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message || "Failed to send clipboard data." }),
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export const Route = createFileRoute("/api/crossdevice/send")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      POST: async ({ request }) => handleCrossDeviceSend(request),
    },
  },
});
