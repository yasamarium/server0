const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
  "Content-Type": "application/json; charset=utf-8",
};

async function handleGetUser(request: Request) {
  try {
    const urlObj = new URL(request.url);
    const username = urlObj.searchParams.get("username")?.trim().replace(/^@/, "");

    if (!username) {
      return new Response(JSON.stringify({ success: false, error: "Missing 'username' query parameter." }), {
        status: 400,
        headers: CORS_HEADERS,
      });
    }

    // Attempt to fetch from vxtwitter first (more reliable)
    try {
      const res = await fetch(`https://api.vxtwitter.com/${encodeURIComponent(username)}`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        },
      });

      if (res.ok) {
        const user = await res.json();
        if (user && user.screen_name) {
          return new Response(JSON.stringify({
            success: true,
            user: {
              name: user.name,
              screen_name: user.screen_name,
              avatar_url: user.profile_image_url?.replace("_normal", "_400x400") || "",
              description: user.description || "",
              followers: user.followers_count || 0,
              following: user.following_count || 0,
              tweets: user.tweet_count || 0,
              location: user.location || "",
            }
          }), {
            status: 200,
            headers: CORS_HEADERS,
          });
        }
      }
    } catch (e: any) {
      console.error("VxTwitter fetch failed, trying FxTwitter...", e.message);
    }

    // Fallback to fxtwitter
    const res = await fetch(`https://api.fxtwitter.com/${encodeURIComponent(username)}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      },
    });

    const data = await res.json();
    if (res.ok && data.code === 200 && data.user) {
      return new Response(JSON.stringify({
        success: true,
        user: {
          name: data.user.name,
          screen_name: data.user.screen_name,
          avatar_url: data.user.avatar_url?.replace("_normal", "_400x400") || "",
          description: data.user.description || "",
          followers: data.user.followers || 0,
          following: data.user.following || 0,
          tweets: data.user.tweets || 0,
          location: data.user.location || "",
        }
      }), {
        status: 200,
        headers: CORS_HEADERS,
      });
    } else {
      return new Response(JSON.stringify({ success: false, error: data.message || "User not found or account is private." }), {
        status: 404,
        headers: CORS_HEADERS,
      });
    }
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message || "Internal server error." }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
}

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/x/user")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      GET: async ({ request }) => handleGetUser(request),
    },
  },
});
