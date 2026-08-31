import { createFileRoute } from "@tanstack/react-router";
import { connectToDatabase } from "../../../lib/mongodb";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
  "Content-Type": "application/json; charset=utf-8",
};

async function handleUpdateProfile(request: Request) {
  try {
    const { username, authHash, dob, religion } = await request.json();

    const cleanUser = username?.trim().toLowerCase();
    if (!cleanUser || !authHash) {
      return new Response(JSON.stringify({ success: false, error: "Missing required fields." }), {
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

    // Update profile fields (use undefined/null to allow removal)
    await db.collection("e2ee_users").updateOne(
      { username: cleanUser },
      { 
        $set: { 
          dob: dob || null, 
          religion: religion || null 
        } 
      }
    );

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: CORS_HEADERS,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message || "Failed to update profile." }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
}

export const Route = createFileRoute("/api/messages/updateprofile")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      POST: async ({ request }) => handleUpdateProfile(request),
    },
  },
});
