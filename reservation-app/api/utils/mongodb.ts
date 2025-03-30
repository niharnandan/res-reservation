import { MongoClient, Db } from 'mongodb';

// Global variables to cache the database connection
let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

// The name of your database
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
    console.log(`Creating new MongoDB connection to database: ${DB_NAME}`);
    
    // Important - use the same connection options consistently across all files
    const client = new MongoClient(uri, {
      // Don't set these options, let MongoDB driver use defaults
      // maxPoolSize: 10, 
      // serverSelectionTimeoutMS: 5000,
    });
    
    // Connect to MongoDB
    await client.connect();
    console.log('Connected to MongoDB server');
    
    // Explicitly get the database by name
    const db = client.db(DB_NAME);
    console.log(`Connected to database: ${DB_NAME}`);
    
    // Cache the client and db connection
    cachedClient = client;
    cachedDb = db;
    
    return { client, db };
  } catch (error) {
    console.error('MongoDB connection error:', error);
    
    // Only reset the cache if connection failed
    cachedClient = null;
    cachedDb = null;
    
    throw error;
  }
}

// Simplified helper to get the database
export async function getDB() {
  const { db } = await connectToDatabase();
  return db;
}

// Simplified helper to get a specific collection
export async function getCollection(name: string) {
  const db = await getDB();
  return db.collection(name);
}

// For use in your API routes
export async function initializeMongoDB() {
  // Just delegate to connectToDatabase
  return connectToDatabase();
}