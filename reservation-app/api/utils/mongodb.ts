import { MongoClient, Db } from 'mongodb';

// Global variables to cache the database connection
let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase() {
  // If we already have a connection, use it
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  const client = new MongoClient(uri, {
    // Optimization for serverless environments
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 30000,  // Increased timeout for long-running operations
  });
  
  try {
    await client.connect();
    
    // Get the database
    const db = client.db();
    
    // Cache the client and db connection
    cachedClient = client;
    cachedDb = db;
    
    // Initialize database indexes if needed
    await initializeIndexes(db);
    
    return { client, db };
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

// Optional: Initialize any needed indexes for your collections
async function initializeIndexes(db: Db) {
  try {
    // Examples of creating indexes (uncomment and modify as needed)
    // await db.collection('bookings').createIndex({ date: 1 });
    // await db.collection('availability').createIndex({ date: 1 });
  } catch (error) {
    console.warn('Error creating indexes:', error);
    // Non-fatal, continue execution
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
  return connectToDatabase();
}