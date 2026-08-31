import { createFileRoute } from "@tanstack/react-router";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
  "Content-Type": "application/json; charset=utf-8",
};

interface NormalizedTweet {
  id: string;
  text: string;
  created_at: string;
  user: {
    name: string;
    screen_name: string;
    avatar_url: string;
  };
  media: Array<{
    type: string;
    url: string;
    thumbnail_url?: string;
  }>;
  likes: number;
  retweets: number;
  replies: number;
  views: number;
}

async function handleGetTweets(request: Request) {
  try {
    const urlObj = new URL(request.url);
    const username = urlObj.searchParams.get("username")?.trim();

    if (!username) {
      return new Response(JSON.stringify({ success: false, error: "Missing 'username' query parameter." }), {
        status: 400,
        headers: CORS_HEADERS,
      });
    }

    const cleanUsername = username.replace(/^@/, "").split("/")[0].split("?")[0];
    const targetUrl = `https://proxy.cors.sh/https://syndication.twitter.com/srv/timeline-profile/screen-name/${encodeURIComponent(cleanUsername)}`;

    const res = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "X-Requested-With": "XMLHttpRequest",
      },
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ success: false, error: `Failed to fetch timeline. Status: ${res.status}` }), {
        status: res.status,
        headers: CORS_HEADERS,
      });
    }

    const html = await res.text();
    const marker = '<script id="__NEXT_DATA__" type="application/json">';
    const startIdx = html.indexOf(marker);

    if (startIdx === -1) {
      return new Response(JSON.stringify({ success: false, error: "Unable to parse timeline payload structure." }), {
        status: 500,
        headers: CORS_HEADERS,
      });
    }

    const endIdx = html.indexOf("</script>", startIdx);
    const jsonStr = html.substring(startIdx + marker.length, endIdx);
    const data = JSON.parse(jsonStr);
    const entries = data.props?.pageProps?.timeline?.entries || [];

    const tweets: NormalizedTweet[] = [];

    for (const entry of entries) {
      if (entry.type !== "tweet") continue;
      const tw = entry.content?.tweet;
      if (!tw) continue;

      // Extract media
      const mediaList: Array<{ type: string; url: string; thumbnail_url?: string }> = [];
      const rawMedia = tw.extended_entities?.media || tw.entities?.media || [];

      for (const m of rawMedia) {
        if (m.type === "video" || m.type === "animated_gif") {
          // Find the best quality mp4 variant
          const variants = m.video_info?.variants || [];
          const mp4s = variants
            .filter((v: any) => v.content_type === "video/mp4" && v.url)
            .sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0));

          const videoUrl = mp4s.length > 0 ? mp4s[0].url : m.video_info?.variants?.[0]?.url || "";
          mediaList.push({
            type: "video",
            url: videoUrl,
            thumbnail_url: m.media_url_https || "",
          });
        } else {
          mediaList.push({
            type: "photo",
            url: m.media_url_https || "",
          });
        }
      }

      tweets.push({
        id: tw.id_str || String(tw.id),
        text: tw.full_text || tw.text || "",
        created_at: tw.created_at || new Date().toISOString(),
        user: {
          name: tw.user?.name || "User",
          screen_name: tw.user?.screen_name || cleanUsername,
          avatar_url: tw.user?.profile_image_url_https || "",
        },
        media: mediaList,
        likes: tw.favorite_count || 0,
        retweets: tw.retweet_count || 0,
        replies: tw.reply_count || 0,
        views: tw.views_count || 0,
      });
    }

    return new Response(JSON.stringify({ success: true, tweets }), {
      status: 200,
      headers: CORS_HEADERS,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message || "Internal server error." }), {
      status: 500,
      headers: CORS_HEADERS,
    });
  }
}

export const Route = createFileRoute("/api/x/tweets")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      GET: async ({ request }) => handleGetTweets(request),
    },
  },
});
