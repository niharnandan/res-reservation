import { MongoClient } from 'mongodb';

// Global variable to cache the database connection
let cachedClient: MongoClient | null = null;
let cachedDb: any = null;

export async function initializeMongoDB() {
  // If the database connection is cached, use it
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  // If no connection, create a new one
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  // Connect to the database
  const client = new MongoClient(uri, {
    // Recommended options for serverless environments
    maxPoolSize: 10,               // Limit connections for serverless
    serverSelectionTimeoutMS: 5000 // Fail fast if unable to connect
  });

  await client.connect();
  const db = client.db();

  // Store connections for future reuse
  cachedClient = client;
  cachedDb = db;

  // Optional: Set up any indexes your application needs
  await setupIndexes(db);

  return { client, db };
}

async function setupIndexes(db: any) {
  // Example: Create indexes for your collections
  // await db.collection('bookings').createIndex({ date: 1 });
  // Add other indexes as needed
}

// Helper function to get database connection
export async function getDatabase() {
  const { db } = await initializeMongoDB();
  return db;
}

// Helper function to get a specific collection
export async function getCollection(collectionName: string) {
  const { db } = await initializeMongoDB();
  return db.collection(collectionName);
}