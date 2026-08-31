import { MongoClient } from "mongodb";

// Construct direct standard connection string using resolved shards & replicaSet name from TXT record
const DIRECT_URI = "mongodb://hostturn:Z05xy35ZVWoGa4IM@ac-ohz9cgi-shard-00-00.ifa4syj.mongodb.net:27017,ac-ohz9cgi-shard-00-01.ifa4syj.mongodb.net:27017,ac-ohz9cgi-shard-00-02.ifa4syj.mongodb.net:27017/botdb?ssl=true&replicaSet=atlas-g7r6yw-shard-0&authSource=admin&retryWrites=true&w=majority&appName=hostturn";

async function testConnection() {
  console.log("Connecting using DIRECT connection string...");
  const client = new MongoClient(DIRECT_URI, {
    connectTimeoutMS: 5000,
    socketTimeoutMS: 5000,
  });

  try {
    await client.connect();
    console.log("Connected successfully!");
    const db = client.db("botdb");
    const collections = await db.listCollections().toArray();
    console.log("Collections:", collections.map(c => c.name));
  } catch (err) {
    console.error("Connection failed:", err);
  } finally {
    await client.close();
  }
}

testConnection();
