const dns = require('dns');
dns.setServers(['1.1.1.1', '8.8.8.8']);

const { MongoClient } = require('mongodb');

const MONGODB_URI = "mongodb+srv://hostturn:Z05xy35ZVWoGa4IM@hostturn.ifa4syj.mongodb.net/botdb?retryWrites=true&w=majority&appName=hostturn";
const MONGODB_DB = "botdb";

async function run() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(MONGODB_DB);
    const messages = await db.collection("e2ee_messages").find({}).toArray();
    console.log('Messages:', JSON.stringify(messages, null, 2));

    const users = await db.collection("e2ee_users").find({}).toArray();
    console.log('Users:', JSON.stringify(users, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

run();
