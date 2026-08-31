import { createFileRoute } from "@tanstack/react-router";
import { fetchAccountsFromLog } from "../../../lib/github-db";
import { getRawPfpUrl } from "../../../lib/github-pfp";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
  "Content-Type": "application/json; charset=utf-8",
};

async function handleGetPfp(request: Request) {
  try {
    const url = new URL(request.url);
    const username = url.searchParams.get("username");

    if (!username) {
      return new Response(
        JSON.stringify({ success: false, error: "Username parameter is required." }),
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const cleanUser = username.trim().toLowerCase();
    const { accounts } = await fetchAccountsFromLog();
    const userAccount = accounts.find((a) => a.id.toLowerCase() === cleanUser);

    const pfpUrl = userAccount?.pfpUrl || getRawPfpUrl(cleanUser, "jpg");

    return new Response(
      JSON.stringify({
        success: true,
        username: cleanUser,
        pfpUrl,
      }),
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message || "Failed to fetch PFP." }),
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export const Route = createFileRoute("/api/pfp/get")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      GET: async ({ request }) => handleGetPfp(request),
    },
  },
});
