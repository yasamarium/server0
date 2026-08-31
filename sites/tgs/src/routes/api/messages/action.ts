import { createFileRoute } from "@tanstack/react-router";
import { connectToDatabase } from "../../../lib/mongodb";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
  "Content-Type": "application/json; charset=utf-8",
};

async function handleAction(request: Request) {
  try {
    const { action, targetUsername, authHash } = await request.json() as any;

    if (!action || !targetUsername || !authHash) {
      return new Response(JSON.stringify({ success: false, error: "Missing required parameters." }), {
        status: 400,
        headers: CORS_HEADERS,
      });
    }

    const { db } = await connectToDatabase();

    // Verify requesting user is the owner AS
    const owner = await db.collection("e2ee_users").findOne({ username: "as" });
    if (!owner || owner.passwordHash !== authHash) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized. Owner clearance required." }), {
        status: 403,
        headers: CORS_HEADERS,
      });
    }

    const targetUser = targetUsername.trim().toLowerCase();

    if (targetUser === "as" || targetUser === "maiko ai") {
      return new Response(JSON.stringify({ success: false, error: "System accounts cannot be modified." }), {
        status: 400,
        headers: CORS_HEADERS,
      });
    }

    if (action === "ban") {
      const res = await db.collection("e2ee_users").updateOne(
        { username: targetUser },
        { $set: { banned: true } }
      );
      if (res.matchedCount === 0) {
        return new Response(JSON.stringify({ success: false, error: "User not found." }), {
          status: 404,
          headers: CORS_HEADERS,
        });
      }
      return new Response(JSON.stringify({ success: true, message: `User @${targetUser} has been banned.` }), {
        status: 200,
        headers: CORS_HEADERS,
      });
    }

    if (action === "unban") {
      const res = await db.collection("e2ee_users").updateOne(
        { username: targetUser },
        { $set: { banned: false } }
      );
      if (res.matchedCount === 0) {
        return new Response(JSON.stringify({ success: false, error: "User not found." }), {
          status: 404,
          headers: CORS_HEADERS,
        });
      }
      return new Response(JSON.stringify({ success: true, message: `User @${targetUser} has been unbanned.` }), {
        status: 200,
        headers: CORS_HEADERS,
      });
    }

    if (action === "delete") {
      // 1. Delete user profile
      const userRes = await db.collection("e2ee_users").deleteOne({ username: targetUser });
      if (userRes.deletedCount === 0) {
        return new Response(JSON.stringify({ success: false, error: "User not found." }), {
          status: 404,
          headers: CORS_HEADERS,
        });
      }
      // 2. Delete user's messages
      await db.collection("e2ee_messages").deleteMany({
        $or: [{ sender: targetUser }, { recipient: targetUser }]
      });
      // 3. Delete user's feed posts
      await db.collection("e2ee_feeds").deleteMany({ username: targetUser });

      return new Response(JSON.stringify({ success: true, message: `User @${targetUser} and all their history has been deleted.` }), {
        status: 200,
        headers: CORS_HEADERS,
      });
    }

    return new Response(JSON.stringify({ success: false, error: "Invalid action." }), {
      status: 400,
      headers: CORS_HEADERS,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message || "Action failed." }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
}

export const Route = createFileRoute("/api/messages/action")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      POST: async ({ request }) => handleAction(request),
    },
  },
});
