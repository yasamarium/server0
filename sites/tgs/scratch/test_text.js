import fs from 'fs';

async function checkLastEntries() {
  try {
    const res = await fetch('https://proxy.cors.sh/https://syndication.twitter.com/srv/timeline-profile/screen-name/elonmusk');
    const html = await res.text();
    const marker = '<script id="__NEXT_DATA__" type="application/json">';
    const startIdx = html.indexOf(marker);
    const endIdx = html.indexOf('</script>', startIdx);
    const data = JSON.parse(html.substring(startIdx + marker.length, endIdx));
    const entries = data.props?.pageProps?.timeline?.entries || [];
    
    console.log('Entries total:', entries.length);
    if (entries.length > 0) {
      console.log('Last 5 entries:');
      for (let i = Math.max(0, entries.length - 5); i < entries.length; i++) {
        console.log(`Entry [${i}]: type="${entries[i].type}" entry_id="${entries[i].entry_id}"`);
        console.log(`  Keys:`, Object.keys(entries[i]));
      }
    }
  } catch (e) {
    console.error(e);
  }
}

checkLastEntries();
