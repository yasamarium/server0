import { createFileRoute } from "@tanstack/react-router";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
  "Content-Type": "application/json; charset=utf-8",
};

async function handleYtSearch(request: Request) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get("query");

    if (!query || !query.trim()) {
      return new Response(
        JSON.stringify({ success: false, error: "Search query parameter is required." }),
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const apiUrl = `https://apis.davidcyril.name.ng/youtube/search?query=${encodeURIComponent(query.trim())}`;
    const response = await fetch(apiUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Upstream API error (${response.status}). Could not perform search.`);
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: CORS_HEADERS,
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message || "Failed to search YouTube videos." }),
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export const Route = createFileRoute("/api/ytstream/search")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      GET: async ({ request }) => handleYtSearch(request),
    },
  },
});
