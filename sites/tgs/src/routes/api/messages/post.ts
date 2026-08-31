import { createFileRoute } from "@tanstack/react-router";
import { connectToDatabase } from "../../../lib/mongodb";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
  "Content-Type": "application/json; charset=utf-8",
};

async function handleCreatePost(request: Request) {
  try {
    const { username, authHash, content, mediaUrl } = await request.json();

    const cleanUser = username?.trim().toLowerCase();
    if (!cleanUser || !authHash || (!content?.trim() && !mediaUrl?.trim())) {
      return new Response(JSON.stringify({ success: false, error: "Missing required parameters." }), {
        status: 400,
        headers: CORS_HEADERS,
      });
    }

    const { db } = await connectToDatabase();
    
    // Authenticate user
    const dbUser = await db.collection("e2ee_users").findOne({
      username: cleanUser,
      passwordHash: authHash,
    });

    if (!dbUser) {
      return new Response(JSON.stringify({ success: false, error: "Authentication failed." }), {
        status: 401,
        headers: CORS_HEADERS,
      });
    }

    if (dbUser.banned) {
      return new Response(JSON.stringify({ success: false, error: "Your account is banned." }), {
        status: 403,
        headers: CORS_HEADERS,
      });
    }

    // Insert post
    await db.collection("e2ee_feeds").insertOne({
      username: cleanUser,
      content: content?.trim() || "",
      mediaUrl: mediaUrl?.trim() || "",
      timestamp: new Date().toISOString()
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: CORS_HEADERS,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message || "Failed to create post." }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
}

export const Route = createFileRoute("/api/messages/post")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      POST: async ({ request }) => handleCreatePost(request),
    },
  },
});
