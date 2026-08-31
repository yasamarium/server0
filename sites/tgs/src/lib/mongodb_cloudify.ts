import { MongoClient, Db } from "mongodb";

const CLOUDIFY_URI = "mongodb+srv://as:TqUOV6iJzmTD8tm0@as.jvbzygw.mongodb.net/?appName=as";
const CLOUDIFY_DB = "cloudify";

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToCloudifyDatabase(): Promise<{ client: MongoClient; db: Db }> {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(CLOUDIFY_URI, {
    maxPoolSize: 10,
    minPoolSize: 1,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 30000,
  });

  await client.connect();
  const db = client.db(CLOUDIFY_DB);

  cachedClient = client;
  cachedDb = db;

  // Create indexes for fast search queries
  try {
    await db.collection("songs").createIndex({ title: "text", artist: "text" });
  } catch (e) {
    console.error("Cloudify index creation error:", e);
  }

  return { client, db };
}
