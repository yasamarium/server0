import { createFileRoute } from "@tanstack/react-router";
import { connectToDatabase } from "../../../../lib/mongodb";
import { ObjectId } from "mongodb";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
  "Content-Type": "application/json; charset=utf-8",
};

async function handleLikePost(request: Request) {
  try {
    const { username, authHash, postId } = await request.json();

    const cleanUser = username?.trim().toLowerCase();
    if (!cleanUser || !authHash || !postId) {
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

    // Query current post
    const post = await db.collection("e2ee_feeds").findOne({ _id: new ObjectId(postId) });
    if (!post) {
      return new Response(JSON.stringify({ success: false, error: "Post not found." }), {
        status: 404,
        headers: CORS_HEADERS,
      });
    }

    // Toggle user like in the array
    const likedList = post.likes || [];
    const isLiked = likedList.includes(cleanUser);

    if (isLiked) {
      // Remove from likes
      await db.collection("e2ee_feeds").updateOne(
        { _id: new ObjectId(postId) },
        { $pull: { likes: cleanUser } }
      );
    } else {
      // Add to likes
      await db.collection("e2ee_feeds").updateOne(
        { _id: new ObjectId(postId) },
        { $addToSet: { likes: cleanUser } }
      );
    }

    return new Response(JSON.stringify({ success: true, liked: !isLiked }), {
      status: 200,
      headers: CORS_HEADERS,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message || "Failed to toggle like." }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
}

export const Route = createFileRoute("/api/messages/feed/like")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      POST: async ({ request }) => handleLikePost(request),
    },
  },
});
