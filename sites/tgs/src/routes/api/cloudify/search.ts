import { createFileRoute } from "@tanstack/react-router";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
  "Content-Type": "application/json; charset=utf-8",
};

async function handleSearch(request: Request) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get("query");

    if (!query) {
      return new Response(JSON.stringify({ success: false, error: "Query parameter is required" }), {
        status: 400,
        headers: CORS_HEADERS,
      });
    }

    const apiUrl = `https://apis.davidcyril.name.ng/play?query=${encodeURIComponent(query)}`;
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`External API returned status: ${response.status}`);
    }
    
    const data = await response.json();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: CORS_HEADERS,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message || "Failed to query music API." }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
}

export const Route = createFileRoute("/api/cloudify/search")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      GET: async ({ request }) => handleSearch(request),
    },
  },
});
