import { createFileRoute } from "@tanstack/react-router";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
  "Content-Type": "application/json; charset=utf-8",
};

export async function resolveTmpfilesDirectUrl(pageUrl: string): Promise<string> {
  if (!pageUrl) return "";
  let cleanUrl = pageUrl.trim();
  if (!cleanUrl.startsWith("http")) return cleanUrl;

  try {
    const pageRes = await fetch(cleanUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (pageRes.ok) {
      const html = await pageRes.text();
      // Match direct image link inside tmpfiles.org HTML page
      const imgMatch = html.match(/<img[^>]+src=["'](https?:\/\/[^"']*tmpfiles\.org\/dl\/[^"']+)["']/i);
      if (imgMatch && imgMatch[1]) {
        return imgMatch[1];
      }

      const anchorMatch = html.match(/<a[^>]+href=["'](https?:\/\/[^"']*tmpfiles\.org\/dl\/[^"']+)["']/i);
      if (anchorMatch && anchorMatch[1]) {
        return anchorMatch[1];
      }
    }
  } catch (e) {
    console.warn("HTML scrape failed for tmpfiles:", e);
  }

  // Fallback: insert /dl/ if missing
  if (cleanUrl.includes("tmpfiles.org/") && !cleanUrl.includes("tmpfiles.org/dl/")) {
    cleanUrl = cleanUrl.replace("tmpfiles.org/", "tmpfiles.org/dl/");
  }

  return cleanUrl;
}

async function handleImageGenerate(request: Request) {
  try {
    const reqUrl = new URL(request.url);
    let prompt = reqUrl.searchParams.get("prompt") || reqUrl.searchParams.get("p") || "";
    let model = (reqUrl.searchParams.get("model") || "flux").toLowerCase();

    if (request.method === "POST") {
      try {
        const body = (await request.json()) as any;
        if (body.prompt || body.p) prompt = body.prompt || body.p;
        if (body.model) model = body.model.toLowerCase();
      } catch {}
    }

    if (!prompt || !prompt.trim()) {
      return new Response(
        JSON.stringify({ success: false, error: "Please enter an image generation prompt." }),
        { status: 400, headers: CORS_HEADERS }
      );
    }

    let targetApiUrl = "";
    if (model === "animagine" || model === "anime") {
      targetApiUrl = `https://apis.davidcyril.name.ng/animagine?prompt=${encodeURIComponent(prompt.trim())}`;
    } else if (model === "epicrealism" || model === "realism") {
      targetApiUrl = `https://apis.davidcyril.name.ng/epicrealism?prompt=${encodeURIComponent(prompt.trim())}`;
    } else {
      targetApiUrl = `https://apis.davidcyril.name.ng/fluxv2?prompt=${encodeURIComponent(prompt.trim())}`;
    }

    const apiRes = await fetch(targetApiUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json",
      },
    });

    if (!apiRes.ok) {
      return new Response(
        JSON.stringify({ success: false, error: `Upstream AI image service error (${apiRes.status})` }),
        { status: apiRes.status, headers: CORS_HEADERS }
      );
    }

    const data = await apiRes.json();
    const rawUrl = data.result || data.cdn_url || data.url || data.image || "";

    if (!rawUrl || typeof rawUrl !== "string") {
      return new Response(
        JSON.stringify({ success: false, error: "Failed to generate image. Upstream service returned empty result." }),
        { status: 500, headers: CORS_HEADERS }
      );
    }

    // Scrape direct .png URL from tmpfiles HTML page
    const directPngUrl = await resolveTmpfilesDirectUrl(rawUrl);

    return new Response(
      JSON.stringify({
        success: true,
        creator: "AS CLOUD SYSTEM",
        model,
        prompt: prompt.trim(),
        directUrl: directPngUrl,
        origUrl: rawUrl,
      }),
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ success: false, error: err.message || "Failed to generate AI image." }),
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export const Route = createFileRoute("/api/image/generate")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      GET: async ({ request }) => handleImageGenerate(request),
      POST: async ({ request }) => handleImageGenerate(request),
    },
  },
});
