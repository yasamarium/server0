import { createFileRoute } from "@tanstack/react-router";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
  "Content-Type": "application/json; charset=utf-8",
};

async function handleInstagramDownload(request: Request) {
  try {
    const body = (await request.json()) as any;
    const { url } = body;

    if (!url || typeof url !== "string") {
      return new Response(
        JSON.stringify({ success: false, error: "Instagram URL is required." }),
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const cleanUrl = url.trim();
    if (!cleanUrl.includes("instagram.com")) {
      return new Response(
        JSON.stringify({ success: false, error: "Please enter a valid Instagram reel or video URL." }),
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const apiUrl = `https://apis.davidcyril.name.ng/instagram?url=${encodeURIComponent(cleanUrl)}`;
    const apiRes = await fetch(apiUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json",
      },
    });

    if (!apiRes.ok) {
      return new Response(
        JSON.stringify({ success: false, error: `Downloader API service error (${apiRes.status})` }),
        { status: 502, headers: CORS_HEADERS }
      );
    }

    const data = await apiRes.json();

    if (!data.success || !data.result) {
      return new Response(
        JSON.stringify({ success: false, error: data.message || "Failed to fetch Instagram Reel. Make sure the account/reel is public." }),
        { status: 404, headers: CORS_HEADERS }
      );
    }

    const resObj = data.result;
    return new Response(
      JSON.stringify({
        success: true,
        result: {
          video: resObj.video || resObj.url || null,
          thumbnail: resObj.thumbnail || null,
          title: resObj.title || resObj.caption || "Instagram Reel Video",
          quality: resObj.quality || "HD",
          likeCount: resObj.likeCount || null,
          commentCount: resObj.commentCount || null,
          format: resObj.format || "mp4",
        },
      }),
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message || "An unexpected error occurred while fetching Instagram reel." }),
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export const Route = createFileRoute("/api/instagram/download")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      POST: async ({ request }) => handleInstagramDownload(request),
    },
  },
});
