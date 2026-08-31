const dns = require('dns');
dns.setServers(['1.1.1.1', '8.8.8.8']);

const { MongoClient } = require('mongodb');

const MONGODB_URI = "mongodb+srv://hostturn:Z05xy35ZVWoGa4IM@hostturn.ifa4syj.mongodb.net/botdb?retryWrites=true&w=majority&appName=hostturn";
const MONGODB_DB = "botdb";

async function run() {
  console.log('Connecting to MongoDB...');
  const client = new MongoClient(MONGODB_URI, {
    maxPoolSize: 5,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 30000,
  });

  try {
    await client.connect();
    console.log('Connected successfully!');
    const db = client.db(MONGODB_DB);

    // List collections
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));

    // Find owner user if seeded
    const owner = await db.collection("e2ee_users").findOne({ username: "as" });
    console.log('Owner "as" document:', owner);

    // Count messages
    const count = await db.collection("e2ee_messages").countDocuments();
    console.log('Total messages:', count);

  } catch (e) {
    console.error('Connection failed:', e);
  } finally {
    await client.close();
  }
}

run();
