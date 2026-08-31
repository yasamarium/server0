import { createFileRoute } from "@tanstack/react-router";
import { connectToCloudifyDatabase } from "../../../lib/mongodb_cloudify";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
  "Content-Type": "application/json; charset=utf-8",
};

async function handleGetSongs(request: Request) {
  try {
    const { db } = await connectToCloudifyDatabase();
    
    // Fetch all songs sorted by newest
    const songs = await db.collection("songs")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return new Response(JSON.stringify({
      success: true,
      songs: songs.map(s => ({
        id: s._id.toString(),
        title: s.title,
        artist: s.artist,
        coverUrl: s.coverUrl,
        audioUrl: s.audioUrl,
        createdAt: s.createdAt,
      }))
    }), {
      status: 200,
      headers: CORS_HEADERS,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message || "Failed to fetch songs." }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
}

export const Route = createFileRoute("/api/cloudify/songs")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      GET: async ({ request }) => handleGetSongs(request),
    },
  },
});
