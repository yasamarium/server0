import { createFileRoute } from "@tanstack/react-router";
import { getClipboardItemByCode } from "../../../lib/github-crossdevice";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
  "Content-Type": "application/json; charset=utf-8",
};

async function handleCrossDeviceReceive(request: Request) {
  try {
    const reqUrl = new URL(request.url);
    let code = reqUrl.searchParams.get("code") || "";

    if (request.method === "POST") {
      try {
        const body = (await request.json()) as any;
        if (body.code) code = body.code;
      } catch {}
    }

    const cleanCode = code.trim().replace(/\D/g, "");

    if (!cleanCode || cleanCode.length !== 7) {
      return new Response(
        JSON.stringify({ success: false, error: "Please enter a valid 7-digit numerical transfer code." }),
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const item = await getClipboardItemByCode(cleanCode);

    if (!item) {
      return new Response(
        JSON.stringify({ success: false, error: `No item found for code '${cleanCode}'. Please verify your 7-digit code.` }),
        { status: 404, headers: CORS_HEADERS }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        item,
      }),
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message || "Failed to fetch clipboard item." }),
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export const Route = createFileRoute("/api/crossdevice/receive")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      GET: async ({ request }) => handleCrossDeviceReceive(request),
      POST: async ({ request }) => handleCrossDeviceReceive(request),
    },
  },
});
