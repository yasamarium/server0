import { createFileRoute } from "@tanstack/react-router";
import { loginAccountFromLog } from "../../../lib/github-db";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
  "Content-Type": "application/json; charset=utf-8",
};

async function handleLoginAccount(request: Request) {
  try {
    const { id, pass } = (await request.json()) as { id?: string; pass?: string };

    if (!id || !pass) {
      return new Response(JSON.stringify({ success: false, error: "ID and Password are required." }), {
        status: 400,
        headers: CORS_HEADERS,
      });
    }

    const result = await loginAccountFromLog(id, pass);

    if (!result.success) {
      return new Response(JSON.stringify({ success: false, error: result.error }), {
        status: 401,
        headers: CORS_HEADERS,
      });
    }

    return new Response(JSON.stringify({ success: true, account: result.account }), {
      status: 200,
      headers: CORS_HEADERS,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message || "Failed to log in." }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
}

export const Route = createFileRoute("/api/accounts/login")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      POST: async ({ request }) => handleLoginAccount(request),
    },
  },
});
