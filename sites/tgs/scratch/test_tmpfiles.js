async function resolveTmpfilesDirectUrl(pageUrl) {
  if (!pageUrl) return "";
  let cleanUrl = pageUrl.trim();

  // If pageUrl is not starting with http, return empty
  if (!cleanUrl.startsWith("http")) return cleanUrl;

  try {
    // Ensure we fetch page
    const pageRes = await fetch(cleanUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (pageRes.ok) {
      const html = await pageRes.text();
      // Match img src or download anchor href containing tmpfiles.org/dl/
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
    console.warn("HTML scrape failed:", e);
  }

  // Fallback: insert /dl/ if missing
  if (cleanUrl.includes("tmpfiles.org/") && !cleanUrl.includes("tmpfiles.org/dl/")) {
    cleanUrl = cleanUrl.replace("tmpfiles.org/", "tmpfiles.org/dl/");
  }

  return cleanUrl;
}

async function testAll() {
  console.log("Testing Flux v2...");
  const r1 = await fetch("https://apis.davidcyril.name.ng/fluxv2?prompt=cyberpunk+city");
  const j1 = await r1.json();
  const d1 = await resolveTmpfilesDirectUrl(j1.result);
  console.log("Flux direct PNG URL:", d1);

  console.log("Testing Animagine...");
  const r2 = await fetch("https://apis.davidcyril.name.ng/animagine?prompt=anime+girl");
  const j2 = await r2.json();
  const d2 = await resolveTmpfilesDirectUrl(j2.cdn_url || j2.result);
  console.log("Animagine direct PNG URL:", d2);
}

testAll();
