import { createFileRoute } from "@tanstack/react-router";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
  "Content-Type": "application/json; charset=utf-8",
};

async function handleYtDownload(request: Request) {
  try {
    const url = new URL(request.url);
    const targetUrl = url.searchParams.get("url");

    if (!targetUrl) {
      return new Response(
        JSON.stringify({ success: false, error: "YouTube URL parameter is required." }),
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const apiUrl = `https://apis.davidcyril.name.ng/download/savetube?url=${encodeURIComponent(targetUrl.trim())}`;
    const response = await fetch(apiUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Upstream API error (${response.status}). Check YouTube URL.`);
    }

    const data = await response.json();

    if (!data.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: data.error || data.message || "Failed to extract YouTube video download link.",
        }),
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const videoData = data.data || data.result || {};
    const normalizedResult = {
      title: videoData.title || "YouTube Video",
      thumbnail: videoData.cover || videoData.thumbnail || "",
      cover: videoData.cover || videoData.thumbnail || "",
      type: videoData.type || "video",
      format: videoData.format || "mp4",
      quality: videoData.quality
        ? (String(videoData.quality).toLowerCase().endsWith("p")
            ? videoData.quality
            : `${videoData.quality}p`)
        : "720p",
      duration: videoData.duration || "",
      download_url: videoData.download_url || videoData.url || "",
    };

    return new Response(
      JSON.stringify({
        creator: data.creator || "David Cyril",
        status: 200,
        success: true,
        result: normalizedResult,
        data: normalizedResult,
      }),
      {
        status: 200,
        headers: CORS_HEADERS,
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message || "Failed to download YouTube video." }),
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export const Route = createFileRoute("/api/ytdl/download")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      GET: ({ request }) => handleYtDownload(request),
    },
  },
});

