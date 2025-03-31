import { MongoClient, Db } from 'mongodb';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;
const DB_NAME = 'restaurant-bookings';

export async function connectToDatabase() {
  // If we already have a connection, use it
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  try {
    // Create new MongoDB client
    const client = new MongoClient(uri);
    
    // Connect to MongoDB
    await client.connect();
    console.log('Connected to MongoDB');
    
    // Get database reference
    const db = client.db(DB_NAME);
    
    // Cache the client and db connection
    cachedClient = client;
    cachedDb = db;
    
    return { client, db };
  } catch (error) {
    console.error('MongoDB connection error:', error);
    cachedClient = null;
    cachedDb = null;
    throw error;
  }
}