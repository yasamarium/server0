import { createFileRoute } from "@tanstack/react-router";
import { connectToDatabase } from "../../../lib/mongodb";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
  "Content-Type": "application/json; charset=utf-8",
};

async function handleListMessages(request: Request) {
  try {
    const urlObj = new URL(request.url);
    const username = urlObj.searchParams.get("username")?.trim().toLowerCase();
    const authHash = urlObj.searchParams.get("authHash")?.trim();

    if (!username || !authHash) {
      return new Response(JSON.stringify({ success: false, error: "Missing authentication parameters." }), {
        status: 400,
        headers: CORS_HEADERS,
      });
    }

    const { db } = await connectToDatabase();

    // Authenticate user
    const user = await db.collection("e2ee_users").findOne({ username });
    if (!user || user.passwordHash !== authHash) {
      return new Response(JSON.stringify({ success: false, error: "Authentication failed." }), {
        status: 401,
        headers: CORS_HEADERS,
      });
    }

    if (user.banned) {
      return new Response(JSON.stringify({ success: false, error: "Your account has been banned by owner." }), {
        status: 403,
        headers: CORS_HEADERS,
      });
    }

    // Fetch messages where user is sender or recipient
    const messages = await db
      .collection("e2ee_messages")
      .find({
        $or: [{ sender: username }, { recipient: username }]
      })
      .sort({ timestamp: 1 })
      .toArray();

    return new Response(JSON.stringify({
      success: true,
      messages: messages.map(msg => ({
        id: msg._id.toString(),
        sender: msg.sender,
        recipient: msg.recipient,
        encryptedContent: msg.encryptedContent,
        iv: msg.iv,
        timestamp: msg.timestamp
      }))
    }), {
      status: 200,
      headers: CORS_HEADERS,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message || "Failed to fetch messages." }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
}

export const Route = createFileRoute("/api/messages/list")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      GET: async ({ request }) => handleListMessages(request),
    },
  },
});
