import { createFileRoute } from "@tanstack/react-router";
import { connectToDatabase } from "../../../lib/mongodb";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
  "Content-Type": "application/json; charset=utf-8",
};

async function handleRegister(request: Request) {
  try {
    const { username, passwordHash, publicKey, encryptedPrivateKey, salt } = await request.json() as any;

    if (!username || !passwordHash || !publicKey || !encryptedPrivateKey || !salt) {
      return new Response(JSON.stringify({ success: false, error: "Missing required fields." }), {
        status: 400,
        headers: CORS_HEADERS,
      });
    }

    const cleanUsername = username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,20}$/.test(cleanUsername)) {
      return new Response(JSON.stringify({ success: false, error: "Username must be 3-20 characters, alphanumeric or underscores." }), {
        status: 400,
        headers: CORS_HEADERS,
      });
    }

    const { db } = await connectToDatabase();
    
    // Check if user exists
    const existing = await db.collection("e2ee_users").findOne({ username: cleanUsername });
    if (existing) {
      return new Response(JSON.stringify({ success: false, error: "Username is already taken." }), {
        status: 400,
        headers: CORS_HEADERS,
      });
    }

    // Insert user
    await db.collection("e2ee_users").insertOne({
      username: cleanUsername,
      passwordHash,
      publicKey,
      encryptedPrivateKey,
      salt,
      createdAt: new Date()
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: CORS_HEADERS,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message || "Registration failed." }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
}

export const Route = createFileRoute("/api/messages/register")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      POST: async ({ request }) => handleRegister(request),
    },
  },
});
