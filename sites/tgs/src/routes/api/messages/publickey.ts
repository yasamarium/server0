import { createFileRoute } from "@tanstack/react-router";
import { connectToDatabase } from "../../../lib/mongodb";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
  "Content-Type": "application/json; charset=utf-8",
};

async function handleGetPublicKey(request: Request) {
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
    
    // Auto-seed owner account "as" if not exists
    if (username === "as") {
      const ownerExists = await db.collection("e2ee_users").findOne({ username: "as" });
      if (!ownerExists) {
        await db.collection("e2ee_users").insertOne({
          username: "as",
          passwordHash: "2fd4bb1476ab2f58343a6111204d1d5e955c88b049a38f98aa35d4580d47830a",
          publicKey: "{\"key_ops\":[],\"ext\":true,\"kty\":\"EC\",\"x\":\"qWbni2cGUBvW42P-LR4fQ1BE_K6IejMMQ1L6n4NEtHc\",\"y\":\"M0E_wPpZijOZL_wv9O_sHP2KmgE1RLi1dx0aNBGK6HE\",\"crv\":\"P-256\"}",
          encryptedPrivateKey: "{\"iv\":\"101112131415161718191a1b\",\"ciphertext\":\"dcfc5b99963913bbac19f5859f6edbec6c0140c020c157753b2c20a8d9829f0347aca0948b060eb30c983b7033b104df84eb6bbf92a236ed1f6575375ab45575cd2fb78588cfc9106208b6d891f5480de064a047b37788e1774e087788b59e4c73a708d4b94e9b583d50508d596ac3df62a73cc19fc6bbf839b2253ae66816c25c848c0cc9467f9a62b286b14a2f37832675533af0c0205ec6f798999c5cf80ceeee91cf1968b03dde4854d186407b534e9fb5271a43dd11345e0a5cbde2344a3ee6d8d2dc47a58492f17eb4630b632fc9019a1249d005b903dbf49e97eaa949646bf1\"}",
          salt: "000102030405060708090a0b0c0d0e0f",
          pfpUrl: "https://files.catbox.moe/k3l26v.jpg", // A premium avatar by default
          dob: "2026-07-06",
          religion: "Owner",
          createdAt: new Date()
        });
      }
    }

    const user = await db.collection("e2ee_users").findOne({ username });

    if (!user) {
      return new Response(JSON.stringify({ success: false, error: "User not found." }), {
        status: 404,
        headers: CORS_HEADERS,
      });
    }

    return new Response(JSON.stringify({
      success: true,
      publicKey: user.publicKey,
      encryptedPrivateKey: user.encryptedPrivateKey, // Also return this so they can download and decrypt it locally during login!
      salt: user.salt,
      pfpUrl: user.pfpUrl,
      dob: user.dob || null,
      religion: user.religion || null,
      banned: user.banned || false
    }), {
      status: 200,
      headers: CORS_HEADERS,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message || "Failed to fetch user info." }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
}

export const Route = createFileRoute("/api/messages/publickey")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      GET: async ({ request }) => handleGetPublicKey(request),
    },
  },
});
