import { createFileRoute } from "@tanstack/react-router";
import { validateAndIncrementApiKey } from "../../../lib/github-api-records";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization, x-api-key",
  "Content-Type": "application/json; charset=utf-8",
};

async function handleYtV3Proxy(request: Request) {
  try {
    const reqUrl = new URL(request.url);
    let videoUrl = reqUrl.searchParams.get("url") || "";
    let apiKey = reqUrl.searchParams.get("apikey") || request.headers.get("x-api-key") || "";

    if (request.method === "POST") {
      try {
        const body = (await request.json()) as any;
        if (body.url) videoUrl = body.url;
        if (body.apikey) apiKey = body.apikey;
      } catch {}
    }

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          creator: "AS CLOUD SYSTEM",
          status: 401,
          success: false,
          error: "API key is missing. Please provide 'apikey' parameter or 'x-api-key' header.",
        }),
        { status: 401, headers: CORS_HEADERS }
      );
    }

    // Validate key against nonxe/recordsapi database
    const keyCheck = await validateAndIncrementApiKey(apiKey, "ytv3");
    if (!keyCheck.valid) {
      return new Response(
        JSON.stringify({
          creator: "AS CLOUD SYSTEM",
          status: 403,
          success: false,
          error: "Invalid or revoked API key. Generate an API key in AS CLOUD API SERVICES.",
        }),
        { status: 403, headers: CORS_HEADERS }
      );
    }

    if (!videoUrl) {
      return new Response(
        JSON.stringify({
          creator: "AS CLOUD SYSTEM",
          status: 400,
          success: false,
          error: "YouTube video URL is required. Pass ?url=https://www.youtube.com/watch?v=...",
        }),
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const targetUrl = `https://apis.davidcyril.name.ng/download/savetube?url=${encodeURIComponent(videoUrl.trim())}`;
    const apiRes = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json",
      },
    });

    if (!apiRes.ok) {
      return new Response(
        JSON.stringify({
          creator: "AS CLOUD SYSTEM",
          status: apiRes.status,
          success: false,
          error: `Upstream service error (${apiRes.status})`,
        }),
        { status: apiRes.status, headers: CORS_HEADERS }
      );
    }

    const data = await apiRes.json();

    if (!data.success) {
      return new Response(
        JSON.stringify({
          creator: "AS CLOUD SYSTEM",
          status: 400,
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

    // Transform creator to AS CLOUD SYSTEM and return normalized result and data
    const responsePayload = {
      creator: "AS CLOUD SYSTEM",
      status: 200,
      success: true,
      result: normalizedResult,
      data: normalizedResult,
    };

    return new Response(JSON.stringify(responsePayload, null, 2), {
      status: 200,
      headers: CORS_HEADERS,
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        creator: "AS CLOUD SYSTEM",
        status: 500,
        success: false,
        error: err.message || "Failed to process YouTube downloader API proxy request.",
      }),
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export const Route = createFileRoute("/api/v1/ytv3")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      GET: async ({ request }) => handleYtV3Proxy(request),
      POST: async ({ request }) => handleYtV3Proxy(request),
    },
  },
});
