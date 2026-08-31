import { createFileRoute } from "@tanstack/react-router";
import { executeQuery } from "../../../lib/github-gitnetwork";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization",
  "Content-Type": "application/json; charset=utf-8",
};

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: CORS });
}

async function handleQuery(request: Request) {
  try {
    const url = new URL(request.url);
    const body = (await request.json()) as any;

    // Credentials can come from query params, body, or connection string
    let dbId = url.searchParams.get("db") || body.db || body.clusterId;
    let apiKey = url.searchParams.get("key") || body.key || body.apiKey;

    // Support URI format parsing if provided in payload: gitnetwork+srv://gn_123:gn_sk_456@edge.gitnetwork.cloud/main
    if (body.connectionString) {
      try {
        const conn = body.connectionString.trim();
        const match = conn.match(/gitnetwork\+srv:\/\/([^:]+):([^@]+)@/);
        if (match) {
          dbId = match[1];
          apiKey = match[2];
        }
      } catch {}
    }

    if (!dbId || !apiKey) {
      return json(
        {
          success: false,
          error: "Missing credentials. Provide 'db' and 'key' in URL or a valid 'connectionString'.",
        },
        401
      );
    }

    const collection = body.collection || body.col || "default";
    const action = body.action || "find";
    const payload = body.payload || { filter: body.filter, doc: body.doc, update: body.update };

    const startTime = performance.now();
    const res = await executeQuery(dbId, apiKey, collection, action, payload);
    const endTime = performance.now();

    return json({
      ...res,
      executionTimeMs: Math.round(endTime - startTime),
    }, res.success ? 200 : 400);
  } catch (err: any) {
    return json({ success: false, error: err.message || "Database execution error." }, 500);
  }
}

export const Route = createFileRoute("/api/gitnetwork/v1")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => handleQuery(request),
      GET: async ({ request }) => handleQuery(request),
    },
  },
});
