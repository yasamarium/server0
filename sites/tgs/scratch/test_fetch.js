async function testRsshub() {
  const instances = [
    'https://rsshub.rssforever.com',
    'https://rss.dfyun.cn',
    'https://rsshub.caixw.com',
    'https://rsshub.pseudoyu.com',
    'https://rsshub.y1y.xyz'
  ];
  
  for (const inst of instances) {
    const url = `${inst}/sotwe/user/elonmusk`;
    console.log(`Testing RSSHub instance: ${url} ...`);
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        },
        signal: AbortSignal.timeout(5000)
      });
      console.log(`Status: ${res.status}`);
      if (res.ok) {
        const text = await res.text();
        console.log(`Length: ${text.length}`);
        console.log(`Contains item:`, text.includes('<item'));
        if (text.includes('<item')) {
          console.log(`SUCCESS! WORKING RSSHUB INSTANCE FOUND: ${inst}`);
          break;
        }
      }
    } catch (e) {
      console.log(`Failed: ${e.message}`);
    }
  }
}

testRsshub();
