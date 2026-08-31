import { createFileRoute } from "@tanstack/react-router";
import { connectToCloudifyDatabase } from "../../../lib/mongodb_cloudify";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
  "Content-Type": "application/json; charset=utf-8",
};

async function handleCreateSong(request: Request) {
  try {
    const { title, artist, coverUrl, audioUrl, auth } = await request.json();

    if (auth !== "as@vercel") {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized access." }), {
        status: 401,
        headers: CORS_HEADERS,
      });
    }

    if (!title || !artist || !coverUrl || !audioUrl) {
      return new Response(JSON.stringify({ success: false, error: "Missing required song fields." }), {
        status: 400,
        headers: CORS_HEADERS,
      });
    }

    const { db } = await connectToCloudifyDatabase();
    
    // Insert new song
    await db.collection("songs").insertOne({
      title: title.trim(),
      artist: artist.trim(),
      coverUrl: coverUrl.trim(),
      audioUrl: audioUrl.trim(),
      createdAt: new Date(),
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: CORS_HEADERS,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message || "Failed to create song." }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
}

export const Route = createFileRoute("/api/cloudify/create")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      POST: async ({ request }) => handleCreateSong(request),
    },
  },
});
