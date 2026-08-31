import { MongoClient } from "mongodb";

const MONGODB_URI = "mongodb+srv://hostturn:Z05xy35ZVWoGa4IM@hostturn.ifa4syj.mongodb.net/botdb?retryWrites=true&w=majority&appName=hostturn";

async function testConnection() {
  console.log("Connecting to MongoDB...");
  const client = new MongoClient(MONGODB_URI, {
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
