import { createFileRoute } from "@tanstack/react-router";
import {
  createCluster,
  getUserClusters,
  deleteCluster,
} from "../../../lib/github-gitnetwork";

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
    const { name, owner } = (await request.json()) as { name?: string; owner?: string };
    if (!name || !owner) {
      return json({ success: false, error: "Database name and owner are required." }, 400);
    }
    const res = await createCluster(name, owner);
    return json(res, res.success ? 200 : 400);
  } catch (err: any) {
    return json({ success: false, error: err.message || "Server error." }, 500);
  }
}

async function handleGet(request: Request) {
  try {
    const url = new URL(request.url);
    const owner = url.searchParams.get("owner");
    if (!owner) return json({ success: false, error: "owner query parameter required." }, 400);

    const clusters = await getUserClusters(owner);
    return json({ success: true, clusters });
  } catch (err: any) {
    return json({ success: false, error: err.message }, 500);
  }
}

async function handleDelete(request: Request) {
  try {
    const { id, owner } = (await request.json()) as { id?: string; owner?: string };
    if (!id || !owner) return json({ success: false, error: "id and owner required." }, 400);

    const res = await deleteCluster(id, owner);
    return json(res, res.success ? 200 : 400);
  } catch (err: any) {
    return json({ success: false, error: err.message }, 500);
  }
}

export const Route = createFileRoute("/api/gitnetwork/manage")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => handlePost(request),
      GET: async ({ request }) => handleGet(request),
      DELETE: async ({ request }) => handleDelete(request),
    },
  },
});
