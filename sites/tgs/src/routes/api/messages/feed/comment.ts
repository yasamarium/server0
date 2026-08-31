import { createFileRoute } from "@tanstack/react-router";
import { connectToDatabase } from "../../../../lib/mongodb";
import { ObjectId } from "mongodb";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
  "Content-Type": "application/json; charset=utf-8",
};

async function handleCommentPost(request: Request) {
  try {
    const { username, authHash, postId, text } = await request.json();

    const cleanUser = username?.trim().toLowerCase();
    if (!cleanUser || !authHash || !postId || !text?.trim()) {
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

    const commentObj = {
      id: new ObjectId().toString(),
      username: cleanUser,
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };

    // Append comment to comments array
    const updateResult = await db.collection("e2ee_feeds").updateOne(
      { _id: new ObjectId(postId) },
      { $push: { comments: commentObj } }
    );

    if (updateResult.matchedCount === 0) {
      return new Response(JSON.stringify({ success: false, error: "Post not found." }), {
        status: 404,
        headers: CORS_HEADERS,
      });
    }

    return new Response(JSON.stringify({ success: true, comment: commentObj }), {
      status: 200,
      headers: CORS_HEADERS,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message || "Failed to add comment." }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
}

export const Route = createFileRoute("/api/messages/feed/comment")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      POST: async ({ request }) => handleCommentPost(request),
    },
  },
});
