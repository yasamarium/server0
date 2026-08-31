const dns = require('dns').promises;

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
