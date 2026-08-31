import { createFileRoute } from "@tanstack/react-router";
import { validateAndIncrementApiKey } from "../../../lib/github-api-records";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization, x-api-key",
  "Content-Type": "application/json; charset=utf-8",
};

async function handleAiProxy(request: Request) {
  try {
    const reqUrl = new URL(request.url);
    let prompt = reqUrl.searchParams.get("prompt") || reqUrl.searchParams.get("text") || "";
    let apiKey = reqUrl.searchParams.get("apikey") || request.headers.get("x-api-key") || "";

    if (request.method === "POST") {
      try {
        const body = (await request.json()) as any;
        if (body.prompt || body.text) prompt = body.prompt || body.text;
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
    const keyCheck = await validateAndIncrementApiKey(apiKey, "ai");
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
          error: "Prompt query is required. Pass ?prompt=Hello",
        }),
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const modelParam = (reqUrl.searchParams.get("model") || "").toLowerCase();
    const isOpus = modelParam === "opus" || modelParam === "claude-opus-4.8";
    const targetUrl = isOpus
      ? `https://apis.davidcyril.name.ng/ai/claude-opus-4.8?prompt=${encodeURIComponent(prompt.trim())}`
      : `https://apis.davidcyril.name.ng/ai/claude-haiku-4.5?prompt=${encodeURIComponent(prompt.trim())}`;
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
          error: `Upstream AI service error (${apiRes.status})`,
        }),
        { status: apiRes.status, headers: CORS_HEADERS }
      );
    }

    const data = await apiRes.json();

    const responsePayload = {
      ...data,
      creator: "AS CLOUD SYSTEM",
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
        error: err.message || "Failed to process AI proxy request.",
      }),
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export const Route = createFileRoute("/api/v1/ai")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      GET: async ({ request }) => handleAiProxy(request),
      POST: async ({ request }) => handleAiProxy(request),
    },
  },
});
