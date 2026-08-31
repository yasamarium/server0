import { createFileRoute } from "@tanstack/react-router";
import { uploadPfpToDbPfp } from "../../../lib/github-pfp";
import { loginAccountFromLog } from "../../../lib/github-db";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
  "Content-Type": "application/json; charset=utf-8",
};

async function handlePfpUpload(request: Request) {
  try {
    const body = (await request.json()) as any;
    const { username, pass, pfpBase64, mimeType } = body;

    if (!username || !pfpBase64) {
      return new Response(
        JSON.stringify({ success: false, error: "Username and PFP image data are required." }),
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

    const result = await uploadPfpToDbPfp(username, pfpBase64, mimeType || "image/png");

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
        pfpUrl: result.pfpUrl,
        message: `Profile picture uploaded successfully!`,
      }),
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message || "Failed to upload PFP." }),
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export const Route = createFileRoute("/api/pfp/upload")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      POST: async ({ request }) => handlePfpUpload(request),
    },
  },
});
