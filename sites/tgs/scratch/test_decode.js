import fs from 'fs';

async function parseSyndication() {
  try {
    const url = 'https://proxy.cors.sh/https://syndication.twitter.com/srv/timeline-profile/screen-name/elonmusk';
    console.log(`Fetching syndication timeline: ${url} ...`);
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    console.log('Status:', res.status);
    const html = await res.text();
    
    // Find __NEXT_DATA__ script tag
    const marker = '<script id="__NEXT_DATA__" type="application/json">';
    const startIdx = html.indexOf(marker);
    if (startIdx !== -1) {
      const endIdx = html.indexOf('</script>', startIdx);
      const jsonStr = html.substring(startIdx + marker.length, endIdx);
      const data = JSON.parse(jsonStr);
      
      console.log('Successfully parsed __NEXT_DATA__!');
      console.log('Keys:', Object.keys(data));
      
      // Extract tweets
      const timeline = data.props?.pageProps?.timeline;
      console.log('Timeline present:', !!timeline);
      
      const entries = timeline?.entries || [];
      console.log('Entries length:', entries.length);
      
      if (entries.length > 0) {
        fs.writeFileSync('C:\\Users\\alike\\.gemini\\antigravity\\brain\\0ed67316-961e-4474-ac5b-0713918c23d7\\scratch\\twv_page.html', JSON.stringify(entries, null, 2));
        console.log('First entry preview:', JSON.stringify(entries[0]).substring(0, 1000));
      }
    } else {
      console.log('__NEXT_DATA__ script tag not found in HTML!');
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
}

parseSyndication();
