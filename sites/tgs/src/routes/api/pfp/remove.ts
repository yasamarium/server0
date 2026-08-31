import { createFileRoute } from "@tanstack/react-router";
import { deletePfpFromDbPfp } from "../../../lib/github-pfp";
import { loginAccountFromLog } from "../../../lib/github-db";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
  "Content-Type": "application/json; charset=utf-8",
};

async function handlePfpRemove(request: Request) {
  try {
    const body = (await request.json()) as any;
    const { username, pass } = body;

    if (!username) {
      return new Response(
        JSON.stringify({ success: false, error: "Username is required." }),
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Authenticate user against nonxe/db if password is provided
    if (pass) {
      const loginCheck = await loginAccountFromLog(username, pass);
      if (!loginCheck.success) {
        return new Response(
          JSON.stringify({ success: false, error: loginCheck.error || "Authentication failed." }),
          { status: 401, headers: CORS_HEADERS }
        );
      }
    }

    const result = await deletePfpFromDbPfp(username);

    if (!result.success) {
      return new Response(JSON.stringify({ success: false, error: result.error }), {
        status: 400,
        headers: CORS_HEADERS,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        username,
        message: `Profile picture removed successfully!`,
      }),
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message || "Failed to remove PFP." }),
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export const Route = createFileRoute("/api/pfp/remove")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      POST: async ({ request }) => handlePfpRemove(request),
    },
  },
});
