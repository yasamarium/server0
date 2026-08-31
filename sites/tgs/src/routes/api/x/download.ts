import { createFileRoute } from "@tanstack/react-router";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
  "Content-Type": "application/json; charset=utf-8",
};

function extractTweetId(url: string): string | null {
  const match = url.match(/status\/(\d+)/i);
  return match ? match[1] : null;
}

async function handleDownloadVideo(request: Request) {
  try {
    const urlObj = new URL(request.url);
    const tweetUrl = urlObj.searchParams.get("url")?.trim();

    if (!tweetUrl) {
      return new Response(JSON.stringify({ success: false, error: "Missing 'url' query parameter." }), {
        status: 400,
        headers: CORS_HEADERS,
      });
    }

    const tweetId = extractTweetId(tweetUrl);
    if (!tweetId) {
      return new Response(JSON.stringify({ success: false, error: "Invalid Twitter/X tweet URL format. Make sure it contains '/status/tweet_id'." }), {
        status: 400,
        headers: CORS_HEADERS,
      });
    }

    // Call FixTweet status endpoint to resolve tweet media details
    const res = await fetch(`https://api.fxtwitter.com/i/status/${tweetId}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 (CLOUD X Client)",
      },
    });

    const data = await res.json();
    if (res.ok && data.code === 200 && data.tweet) {
      const tweet = data.tweet;
      const videos = tweet.media?.videos || [];

      if (videos.length === 0) {
        return new Response(JSON.stringify({ success: false, error: "No video or GIF found in this tweet." }), {
          status: 404,
          headers: CORS_HEADERS,
        });
      }

      // Return the video details list
      return new Response(JSON.stringify({
        success: true,
        text: tweet.text,
        author: {
          name: tweet.author?.name,
          screen_name: tweet.author?.screen_name,
          avatar_url: tweet.author?.avatar_url,
        },
        videos: videos.map((v: any) => ({
          url: v.url,
          thumbnail_url: v.thumbnail_url,
          width: v.width,
          height: v.height,
          duration: v.duration,
        })),
      }), {
        status: 200,
        headers: CORS_HEADERS,
      });
    } else {
      return new Response(JSON.stringify({ success: false, error: data.message || "Tweet not found or is private." }), {
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

export const Route = createFileRoute("/api/x/download")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      GET: async ({ request }) => handleDownloadVideo(request),
    },
  },
});
