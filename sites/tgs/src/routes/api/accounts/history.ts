import { createFileRoute } from "@tanstack/react-router";
import { addHistoryEntry, getUserHistory } from "../../../lib/github-history";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
  "Content-Type": "application/json; charset=utf-8",
};

function getClientIp(request: Request): string {
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp;
  const xForwardedFor = request.headers.get("x-forwarded-for");
  if (xForwardedFor) return xForwardedFor.split(",")[0].trim();
  const xRealIp = request.headers.get("x-real-ip");
  if (xRealIp) return xRealIp;
  return "Unknown IP";
}

async function handleSaveHistory(request: Request) {
  try {
    const { userId, action, detail, ip: clientProvidedIp } = (await request.json()) as {
      userId?: string;
      action?: string;
      detail?: string;
      ip?: string;
    };

    if (!action) {
      return new Response(JSON.stringify({ success: false, error: "action is required." }), {
        status: 400,
        headers: CORS_HEADERS,
      });
    }

    const requestIp = getClientIp(request);
    const ipToUse = clientProvidedIp && clientProvidedIp !== "Unknown IP" ? clientProvidedIp : requestIp;

    const cleanId = userId?.trim();
    const isLoggedIn = cleanId && cleanId.toLowerCase() !== "anonymous" && cleanId.toLowerCase() !== "guest";

    const formattedIdentity = isLoggedIn
      ? `${cleanId} [${ipToUse}]`
      : `[${ipToUse}]`;

    const rawUserId = isLoggedIn ? cleanId : undefined;

    const result = await addHistoryEntry(formattedIdentity, action, detail || "", ipToUse, rawUserId);

    if (!result.success) {
      return new Response(JSON.stringify({ success: false, error: result.error }), {
        status: 500,
        headers: CORS_HEADERS,
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: CORS_HEADERS,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message || "Failed to save history." }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
}

async function handleGetHistory(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return new Response(JSON.stringify({ success: false, error: "userId query param required." }), {
        status: 400,
        headers: CORS_HEADERS,
      });
    }

    const entries = await getUserHistory(userId);

    return new Response(JSON.stringify({ success: true, history: entries }), {
      status: 200,
      headers: CORS_HEADERS,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message || "Failed to fetch history." }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
}

export const Route = createFileRoute("/api/accounts/history")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      POST: async ({ request }) => handleSaveHistory(request),
      GET: async ({ request }) => handleGetHistory(request),
    },
  },
});
