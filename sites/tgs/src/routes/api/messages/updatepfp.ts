import { createFileRoute } from "@tanstack/react-router";
import { connectToDatabase } from "../../../lib/mongodb";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
  "Content-Type": "application/json; charset=utf-8",
};

async function handleUpdatePfp(request: Request) {
  try {
    const { username, authHash, pfpUrl } = await request.json() as any;

    if (!username || !authHash) {
      return new Response(JSON.stringify({ success: false, error: "Missing required fields." }), {
        status: 400,
        headers: CORS_HEADERS,
      });
    }

    const { db } = await connectToDatabase();

    // Authenticate user
    const user = await db.collection("e2ee_users").findOne({ username: username.toLowerCase() });
    if (!user || user.passwordHash !== authHash) {
      return new Response(JSON.stringify({ success: false, error: "Authentication failed." }), {
        status: 401,
        headers: CORS_HEADERS,
      });
    }

    // Update profile picture URL
    await db.collection("e2ee_users").updateOne(
      { username: username.toLowerCase() },
      { $set: { pfpUrl } }
    );

    return new Response(JSON.stringify({ success: true, message: "Profile picture updated." }), {
      status: 200,
      headers: CORS_HEADERS,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message || "Failed to update profile picture." }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
}

export const Route = createFileRoute("/api/messages/updatepfp")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      POST: async ({ request }) => handleUpdatePfp(request),
    },
  },
});
