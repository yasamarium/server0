import { createFileRoute } from "@tanstack/react-router";
import { connectToDatabase } from "../../../lib/mongodb";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
  "Content-Type": "application/json; charset=utf-8",
};

async function handleGetFeed(request: Request) {
  try {
    const urlObj = new URL(request.url);
    const username = urlObj.searchParams.get("username")?.trim().toLowerCase();

    if (!username) {
      return new Response(JSON.stringify({ success: false, error: "Missing username parameter." }), {
        status: 400,
        headers: CORS_HEADERS,
      });
    }

    const { db } = await connectToDatabase();
    const posts = await db
      .collection("e2ee_feeds")
      .find({ username })
      .sort({ timestamp: -1 })
      .toArray();

    return new Response(JSON.stringify({
      success: true,
      posts: posts.map(post => ({
        id: post._id.toString(),
        username: post.username,
        content: post.content,
        mediaUrl: post.mediaUrl,
        timestamp: post.timestamp,
        likes: post.likes || [],
        comments: post.comments || []
      }))
    }), {
      status: 200,
      headers: CORS_HEADERS,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message || "Failed to fetch profile feed." }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
}

export const Route = createFileRoute("/api/messages/feed")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      GET: async ({ request }) => handleGetFeed(request),
    },
  },
});
