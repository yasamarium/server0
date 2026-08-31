import { MongoClient, Db } from "mongodb";

const MONGODB_URI = "mongodb+srv://hostturn:Z05xy35ZVWoGa4IM@hostturn.ifa4syj.mongodb.net/botdb?retryWrites=true&w=majority&appName=hostturn";
const MONGODB_DB = "botdb";

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  // Create new client
  const client = new MongoClient(MONGODB_URI, {
    maxPoolSize: 10,
    minPoolSize: 1,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 30000,
  });

  await client.connect();
  const db = client.db(MONGODB_DB);

  cachedClient = client;
  cachedDb = db;

  // Initialize indexes
  try {
    await db.collection("e2ee_users").createIndex({ username: 1 }, { unique: true });
    await db.collection("e2ee_messages").createIndex({ recipient: 1, timestamp: -1 });
    await db.collection("e2ee_messages").createIndex({ sender: 1, recipient: 1 });
  } catch (e) {
    console.error("Index creation error:", e);
  }

  return { client, db };
}
