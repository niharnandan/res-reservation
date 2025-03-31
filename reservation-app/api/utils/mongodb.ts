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
    // Create new MongoDB client with optimized connection pool settings
    const client = new MongoClient(uri, {
      maxPoolSize: 10, // Optimize connection pool size
      serverSelectionTimeoutMS: 5000, // Reduce timeout for faster failures
    });
    
    // Connect to MongoDB
    await client.connect();
    console.log('Connected to MongoDB');
    
    // Get database reference
    const db = client.db(DB_NAME);
    
    // Create indexes for better query performance
    try {
      // Create compound index on date and time for faster lookups
      await db.collection('bookings').createIndex(
        { date: 1, time: 1 }, 
        { unique: true, background: true }
      );
      
      // Add TTL index for automatic expiration of bookings
      await db.collection('bookings').createIndex(
        { expiresAt: 1 }, 
        { expireAfterSeconds: 0, background: true }
      );
      
      console.log('MongoDB indexes created');
    } catch (indexError) {
      console.warn('Warning: Unable to create indexes', indexError);
      // Continue even if index creation fails
    }
    
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