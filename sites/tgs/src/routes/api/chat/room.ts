import { createFileRoute } from "@tanstack/react-router";
import {
  createRoom,
  joinRoom,
  sendMessage,
  getRoom,
  leaveRoom,
} from "../../../lib/github-chat";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
  "Content-Type": "application/json; charset=utf-8",
};

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: CORS });
}

async function handlePost(request: Request) {
  try {
    const body = (await request.json()) as any;
    const { action } = body;

    if (action === "create") {
      const result = await createRoom(body.roomName, body.username);
      return json(result, result.success ? 200 : 400);
    }

    if (action === "join") {
      const result = await joinRoom(body.code, body.username);
      return json(result, result.success ? 200 : 400);
    }

    if (action === "send") {
      const result = await sendMessage(body.roomId, body.sender, body.text, body.media);
      return json(result, result.success ? 200 : 400);
    }

    if (action === "leave") {
      const result = await leaveRoom(body.roomId, body.username);
      return json(result, result.success ? 200 : 400);
    }

    return json({ success: false, error: "Unknown action." }, 400);
  } catch (err: any) {
    return json({ success: false, error: err.message || "Server error." }, 500);
  }
}

async function handleGet(request: Request) {
  try {
    const url = new URL(request.url);
    const roomId = url.searchParams.get("roomId");
    if (!roomId) return json({ success: false, error: "roomId required." }, 400);

    const room = await getRoom(roomId);
    if (!room) return json({ success: false, error: "Room not found or deleted." }, 404);

    return json({ success: true, room });
  } catch (err: any) {
    return json({ success: false, error: err.message }, 500);
  }
}

export const Route = createFileRoute("/api/chat/room")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => handlePost(request),
      GET: async ({ request }) => handleGet(request),
    },
  },
});
