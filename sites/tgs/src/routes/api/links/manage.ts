import { createFileRoute } from "@tanstack/react-router";
import { createShortLink, getUserLinks, deleteLink } from "../../../lib/github-links";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
  "Content-Type": "application/json; charset=utf-8",
};

async function handleCreate(request: Request) {
  try {
    const { slug, url, createdBy } = (await request.json()) as {
      slug?: string;
      url?: string;
      createdBy?: string;
    };

    if (!slug || !url) {
      return new Response(JSON.stringify({ success: false, error: "slug and url are required." }), {
        status: 400,
        headers: CORS_HEADERS,
      });
    }

    const result = await createShortLink(slug, url, createdBy || "anonymous");

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers: CORS_HEADERS,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message || "Server error." }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
}

async function handleGetUserLinks(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return new Response(JSON.stringify({ success: false, error: "userId required." }), {
        status: 400,
        headers: CORS_HEADERS,
      });
    }

    const links = await getUserLinks(userId);
    return new Response(JSON.stringify({ success: true, links }), {
      status: 200,
      headers: CORS_HEADERS,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
}

async function handleDelete(request: Request) {
  try {
    const { slug, userId } = (await request.json()) as {
      slug?: string;
      userId?: string;
    };

    if (!slug || !userId) {
      return new Response(JSON.stringify({ success: false, error: "slug and userId required." }), {
        status: 400,
        headers: CORS_HEADERS,
      });
    }

    const result = await deleteLink(slug, userId);
    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers: CORS_HEADERS,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
}

export const Route = createFileRoute("/api/links/manage")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      POST: async ({ request }) => handleCreate(request),
      GET: async ({ request }) => handleGetUserLinks(request),
      DELETE: async ({ request }) => handleDelete(request),
    },
  },
});
