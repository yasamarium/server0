import fs from 'fs';

async function findRsshubInstances() {
  try {
    console.log('Fetching RSSHub documentation to extract public instances...');
    const res = await fetch('https://raw.githubusercontent.com/DIYgod/RSSHub/master/docs/guide/README.md');
    if (!res.ok) throw new Error('Failed to fetch RSSHub README');
    const text = await res.text();
    
    // Extract URLs matching rsshub format
    const regex = /https?:\/\/[a-zA-Z0-9.-]+\/sotwe\/user\//g; // Or generic domains
    const domainsRegex = /https?:\/\/[a-zA-Z0-9.-]+(?:\.app|\.dev|\.org|\.fun|\.xyz|\.net|\.one|\.me|\.cc)/g;
    
    const matches = text.match(domainsRegex) || [];
    const uniqueDomains = Array.from(new Set(matches)).filter(d => 
      !d.includes('github.com') && 
      !d.includes('npmjs.com') && 
      !d.includes('twitter.com') && 
      !d.includes('t.me') &&
      !d.includes('rsshub.app') // rsshub.app is blocked/rate-limited
    );
    
    console.log('Extracted unique candidate domains:', uniqueDomains);
    
    // Test them
    const username = 'elonmusk';
    const working = [];
    
    for (const domain of uniqueDomains) {
      const testUrl = `${domain}/sotwe/user/${username}`;
      console.log(`Testing instance: ${testUrl} ...`);
      try {
        const testRes = await fetch(testUrl, {
          signal: AbortSignal.timeout(5000)
        });
        console.log(`  Status: ${testRes.status}`);
        if (testRes.status === 200) {
          const content = await testRes.text();
          if (content.includes('elonmusk') || content.includes('Elon Musk') || content.includes('<item>')) {
            console.log(`  -> SUCCESS! Working instance found: ${domain}`);
            working.push(domain);
          }
        }
      } catch (e) {
        console.log(`  Failed: ${e.message}`);
      }
    }
    
    console.log('ALL WORKING INSTANCES:', working);
  } catch (e) {
    console.error(e);
  }
}

findRsshubInstances();
