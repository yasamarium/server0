import { createFileRoute } from "@tanstack/react-router";
import { validateAndIncrementApiKey } from "../../../lib/github-api-records";
import { resolveTmpfilesDirectUrl } from "../image/generate";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization, x-api-key",
  "Content-Type": "application/json; charset=utf-8",
};

async function handleImageProxy(request: Request) {
  try {
    const reqUrl = new URL(request.url);
    let prompt = reqUrl.searchParams.get("prompt") || reqUrl.searchParams.get("p") || "";
    let model = (reqUrl.searchParams.get("model") || "flux").toLowerCase();
    let apiKey = reqUrl.searchParams.get("apikey") || request.headers.get("x-api-key") || "";

    if (request.method === "POST") {
      try {
        const body = (await request.json()) as any;
        if (body.prompt || body.p) prompt = body.prompt || body.p;
        if (body.model) model = body.model.toLowerCase();
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
    const keyCheck = await validateAndIncrementApiKey(apiKey, "ai-image");
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

    if (!prompt) {
      return new Response(
        JSON.stringify({
          creator: "AS CLOUD SYSTEM",
          status: 400,
          success: false,
          error: "Prompt parameter is required. Pass ?prompt=cyberpunk+city",
        }),
        { status: 400, headers: CORS_HEADERS }
      );
    }

    let targetApiUrl = "";
    if (model === "animagine" || model === "anime") {
      targetApiUrl = `https://apis.davidcyril.name.ng/animagine?prompt=${encodeURIComponent(prompt.trim())}`;
    } else if (model === "epicrealism" || model === "realism") {
      targetApiUrl = `https://apis.davidcyril.name.ng/epicrealism?prompt=${encodeURIComponent(prompt.trim())}`;
    } else {
      targetApiUrl = `https://apis.davidcyril.name.ng/fluxv2?prompt=${encodeURIComponent(prompt.trim())}`;
    }

    const apiRes = await fetch(targetApiUrl, {
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
          error: `Upstream AI image service error (${apiRes.status})`,
        }),
        { status: apiRes.status, headers: CORS_HEADERS }
      );
    }

    const data = await apiRes.json();
    const rawUrl = data.result || data.cdn_url || data.url || data.image || "";
    const directPngUrl = await resolveTmpfilesDirectUrl(rawUrl);

    return new Response(
      JSON.stringify(
        {
          creator: "AS CLOUD SYSTEM",
          status: 200,
          success: true,
          model,
          prompt: prompt.trim(),
          result: directPngUrl,
          download_url: `/api/public/download?url=${encodeURIComponent(directPngUrl)}&name=${model}_image.png`,
        },
        null,
        2
      ),
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        creator: "AS CLOUD SYSTEM",
        status: 500,
        success: false,
        error: err.message || "Failed to process AI image proxy request.",
      }),
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export const Route = createFileRoute("/api/v1/image")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      GET: async ({ request }) => handleImageProxy(request),
      POST: async ({ request }) => handleImageProxy(request),
    },
  },
});
