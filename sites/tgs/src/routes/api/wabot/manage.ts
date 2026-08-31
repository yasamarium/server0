import { createFileRoute } from "@tanstack/react-router";
import {
  fetchWabotSession,
  saveWabotSession,
  triggerWorkflowDispatch,
  stopActiveWorkflows,
  fetchWorkflowRuns,
  WabotSession,
} from "../../../lib/github-wabot";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json",
};

const ADMIN_USER = "as";
const ADMIN_PASS = "as123";

async function handleGet() {
  try {
    const [{ session }, runs] = await Promise.all([
      fetchWabotSession(),
      fetchWorkflowRuns(),
    ]);

    const isRunning = runs.some((r) => r.status === "in_progress" || r.status === "queued" || r.status === "requested");

    return new Response(
      JSON.stringify({
        success: true,
        session,
        runs,
        isRunning,
      }),
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message || "Failed to fetch wabot session." }),
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

async function handlePost(request: Request) {
  try {
    const body = (await request.json()) as any;
    const { action, auth, sessionId, botName, sudo, mode, status } = body;

    // Action: Login Admin Check
    if (action === "admin_login") {
      if (body.username === ADMIN_USER && body.password === ADMIN_PASS) {
        return new Response(
          JSON.stringify({ success: true, adminToken: "wabot_admin_authenticated" }),
          { status: 200, headers: CORS_HEADERS }
        );
      }
      return new Response(
        JSON.stringify({ success: false, error: "Invalid Admin username or password." }),
        { status: 401, headers: CORS_HEADERS }
      );
    }

    // Protect sensitive actions with Admin Auth check
    if (auth?.username !== ADMIN_USER || auth?.password !== ADMIN_PASS) {
      if (auth?.adminToken !== "wabot_admin_authenticated") {
        return new Response(
          JSON.stringify({ success: false, error: "Unauthorized. Admin authentication required." }),
          { status: 403, headers: CORS_HEADERS }
        );
      }
    }

    // Action: Save / Update Single Session ID
    if (action === "save_session") {
      if (!sessionId) {
        return new Response(
          JSON.stringify({ success: false, error: "WhatsApp Session ID is required." }),
          { status: 400, headers: CORS_HEADERS }
        );
      }

      const sessionToSave: WabotSession = {
        sessionId: sessionId.trim(),
        botName: botName ? botName.trim() : "OIEN BOT",
        sudo: sudo ? sudo.trim() : "",
        mode: mode || "public",
        status: status || "active",
        updatedBy: "admin (as)",
        updatedAt: new Date().toISOString(),
      };

      const res = await saveWabotSession(sessionToSave);
      return new Response(JSON.stringify(res), {
        status: res.success ? 200 : 400,
        headers: CORS_HEADERS,
      });
    }

    // Action: Start / Trigger Workflow Dispatch
    if (action === "trigger_workflow" || action === "start_bot" || action === "restart_bot") {
      const res = await triggerWorkflowDispatch();
      return new Response(JSON.stringify(res), {
        status: res.success ? 200 : 400,
        headers: CORS_HEADERS,
      });
    }

    // Action: Stop / Cancel Active Workflow Runs
    if (action === "stop_workflow" || action === "stop_bot") {
      const res = await stopActiveWorkflows();
      return new Response(JSON.stringify(res), {
        status: res.success ? 200 : 400,
        headers: CORS_HEADERS,
      });
    }

    return new Response(JSON.stringify({ success: false, error: "Invalid action." }), {
      status: 400,
      headers: CORS_HEADERS,
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message || "Server error." }),
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export const Route = createFileRoute("/api/wabot/manage")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      GET: async () => handleGet(),
      POST: async ({ request }) => handlePost(request),
    },
  },
});
