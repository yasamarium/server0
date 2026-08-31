import { createFileRoute } from "@tanstack/react-router";
import { connectToCloudifyDatabase } from "../../../lib/mongodb_cloudify";
import { ObjectId } from "mongodb";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
  "Content-Type": "application/json; charset=utf-8",
};

async function handleDeleteSong(request: Request) {
  try {
    const { id, auth } = await request.json();

    if (auth !== "as@vercel") {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized access." }), {
        status: 401,
        headers: CORS_HEADERS,
      });
    }

    if (!id) {
      return new Response(JSON.stringify({ success: false, error: "Missing song ID." }), {
        status: 400,
        headers: CORS_HEADERS,
      });
    }

    const { db } = await connectToCloudifyDatabase();
    
    const result = await db.collection("songs").deleteOne({
      _id: new ObjectId(id)
    });

    if (result.deletedCount === 0) {
      return new Response(JSON.stringify({ success: false, error: "Song not found." }), {
        status: 404,
        headers: CORS_HEADERS,
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: CORS_HEADERS,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message || "Failed to delete song." }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
}

export const Route = createFileRoute("/api/cloudify/delete")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      POST: async ({ request }) => handleDeleteSong(request),
    },
  },
});
