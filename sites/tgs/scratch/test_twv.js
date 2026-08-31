async function scanPageComponent() {
  try {
    const url = 'https://proxy.cors.sh/https://twitterwebviewer.com/_next/static/chunks/app/%5Blocale%5D/page-f9ecc52c7d8b1833.js';
    console.log(`Fetching page component chunk: ${url} ...`);
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      }
    });
    console.log('Status:', res.status);
    if (res.ok) {
      const text = await res.text();
      console.log('Length:', text.length);
      
      // Look for page, cursor, fetch, tweets, loadMore, or query params
      const keywords = ['/api/tweets/', 'loadMore', 'cursor', 'page', 'offset', 'nextCursor'];
      for (const kw of keywords) {
        if (text.includes(kw)) {
          console.log(`Found keyword "${kw}":`);
          let idx = 0;
          while ((idx = text.indexOf(kw, idx)) !== -1) {
            console.log(`  Context:`, text.substring(idx - 60, idx + 120).replace(/\n/g, ' '));
            idx += kw.length;
            if (idx > 2000) break;
          }
        }
      }
    }
  } catch (e) {
    console.error(e);
  }
}

scanPageComponent();
