import fs from 'fs';

async function scanPagination() {
  try {
    const res = await fetch('https://proxy.cors.sh/https://twitterwebviewer.com/_next/static/chunks/4546-d43d4f36f92e3e79.js');
    const text = await res.text();
    
    // Find all occurrences of "api/tweets" or cursor variables
    let idx = 0;
    while ((idx = text.indexOf('/api/tweets/', idx)) !== -1) {
      console.log(`Context near /api/tweets/:`, text.substring(idx - 100, idx + 200).replace(/\n/g, ' '));
      idx += '/api/tweets/'.length;
    }

    const keywords = ['cursor', 'next', 'prev', 'pagination', 'page', 'offset'];
    for (const kw of keywords) {
      if (text.includes(kw)) {
        console.log(`Found keyword: ${kw}`);
        let kwIdx = 0;
        while ((kwIdx = text.indexOf(kw, kwIdx)) !== -1) {
          console.log(`  Context near ${kw}:`, text.substring(kwIdx - 50, kwIdx + 100).replace(/\n/g, ' '));
          kwIdx += kw.length;
          if (kwIdx > 2000) break; // Limit context search per keyword
        }
      }
    }
  } catch (e) {
    console.error(e);
  }
}

scanPagination();
