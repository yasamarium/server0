import { createFileRoute } from "@tanstack/react-router";

const DB_CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, Origin",
  "Access-Control-Max-Age": "86400",
  "Content-Type": "application/json; charset=utf-8",
};

async function handleCreateDb(request: Request) {
  try {
    const body = await request.json() as any;
    const title = body.title?.toString() || "shsDB Node";
    const url = body.url?.toString() || "";
    const dataPayload = body.data;

    if (dataPayload === undefined || dataPayload === null) {
      return new Response(JSON.stringify({ success: false, error: "Missing 'data' field in body" }), {
        status: 400,
        headers: DB_CORS,
      });
    }

    // Structure shsDB payload
    const payload = {
      title,
      url,
      data: dataPayload,
      timestamp: new Date().toISOString()
    };

    const payloadString = JSON.stringify(payload, null, 2);

    // Publish to paste.rs
    const response = await fetch("https://paste.rs/", {
      method: "POST",
      body: payloadString,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Content-Type": "text/plain",
      }
    });

    if (!response.ok) {
      throw new Error(`paste.rs rejected upload: ${response.statusText}`);
    }

    const pasteUrl = await response.text();
    const cleanPasteUrl = pasteUrl.trim();
    
    // Extract key from URL (e.g. https://paste.rs/abc -> abc)
    const key = cleanPasteUrl.split("/").pop() || "";

    if (!key) {
      throw new Error("Unable to parse unique key from paste.rs response.");
    }

    const origin = request.headers.get("origin") || new URL(request.url).origin;

    return new Response(JSON.stringify({
      success: true,
      key: key,
      url: `${origin}/shsdb/${key}`
    }), {
      status: 200,
      headers: DB_CORS,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message || "Failed to create shsDB node" }), {
      status: 500,
      headers: DB_CORS,
    });
  }
}

export const Route = createFileRoute("/shsdb/create")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: DB_CORS }),
      POST: async ({ request }) => handleCreateDb(request),
    },
  },
});
