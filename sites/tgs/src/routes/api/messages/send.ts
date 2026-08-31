import { createFileRoute } from "@tanstack/react-router";
import { connectToDatabase } from "../../../lib/mongodb";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
  "Content-Type": "application/json; charset=utf-8",
};

async function handleSendMessage(request: Request) {
  try {
    const { sender, recipient, encryptedContent, iv, authHash } = await request.json() as any;

    if (!sender || !recipient || !encryptedContent || !iv || !authHash) {
      return new Response(JSON.stringify({ success: false, error: "Missing required fields." }), {
        status: 400,
        headers: CORS_HEADERS,
      });
    }

    const { db } = await connectToDatabase();

    // Authenticate Sender
    const senderUser = await db.collection("e2ee_users").findOne({ username: sender.toLowerCase() });
    if (!senderUser || senderUser.passwordHash !== authHash) {
      return new Response(JSON.stringify({ success: false, error: "Authentication failed." }), {
        status: 401,
        headers: CORS_HEADERS,
      });
    }

    if (senderUser.banned) {
      return new Response(JSON.stringify({ success: false, error: "Your account is banned." }), {
        status: 403,
        headers: CORS_HEADERS,
      });
    }

    // Verify recipient exists
    const recipientUser = await db.collection("e2ee_users").findOne({ username: recipient.toLowerCase() });
    if (!recipientUser) {
      return new Response(JSON.stringify({ success: false, error: "Recipient not found." }), {
        status: 404,
        headers: CORS_HEADERS,
      });
    }

    // Save message
    const messageDoc = {
      sender: sender.toLowerCase(),
      recipient: recipient.toLowerCase(),
      encryptedContent,
      iv,
      timestamp: new Date()
    };

    await db.collection("e2ee_messages").insertOne(messageDoc);

    return new Response(JSON.stringify({ success: true, message: "Message sent." }), {
      status: 200,
      headers: CORS_HEADERS,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message || "Failed to send message." }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
}

export const Route = createFileRoute("/api/messages/send")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      POST: async ({ request }) => handleSendMessage(request),
    },
  },
});
