const dns = require('dns').promises;

// Set DNS servers to Cloudflare & Google public DNS to bypass local router blocks
dns.setServers(['1.1.1.1', '8.8.8.8']);

async function run() {
  try {
    console.log('Resolving hostturn SRV...');
    const srv = await dns.resolveSrv('_mongodb._tcp.hostturn.ifa4syj.mongodb.net');
    console.log('SRV Result:', srv);
  } catch (e) {
    console.error('SRV Failed:', e);
  }

  try {
    console.log('Resolving as SRV...');
    const srv = await dns.resolveSrv('_mongodb._tcp.as.jvbzygw.mongodb.net');
    console.log('SRV Result:', srv);
  } catch (e) {
    console.error('SRV Failed:', e);
  }
}

run();
