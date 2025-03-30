import { MongoClient } from 'mongodb';

require('dotenv').config();
const uri = process.env.MONGODB_URI as string;
let cachedClient: MongoClient | null = null;

export async function connectToDatabase(): Promise<MongoClient> {
  if (cachedClient) {
    return cachedClient;
  }

  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  try {
    const client = new MongoClient(uri);
    await client.connect();
    
    // Test the connection
    await client.db('admin').command({ ping: 1 });
    console.log('Connected successfully to MongoDB');
    
    cachedClient = client;
    return client;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
}

/**
 * Initialize MongoDB - creates indexes for better performance
 */
export async function initializeMongoDB(): Promise<void> {
  try {
    const client = await connectToDatabase();
    const db = client.db('restaurant-bookings');
    
    // Create collections if they don't exist
    const collections = await db.listCollections().toArray();
    if (!collections.some(c => c.name === 'bookings')) {
      await db.createCollection('bookings');
      console.log('Created bookings collection');
    }
    
    // Create indexes
    const bookings = db.collection('bookings');
    
    // Index for querying by date (for availability checks)
    await bookings.createIndex({ date: 1 });
    
    // Compound index for date and time (for slot availability)
    await bookings.createIndex({ date: 1, time: 1 }, { unique: true });
    
    // Index for expiration (TTL index)
    await bookings.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    
    // Index for customer lookups
    await bookings.createIndex({ customerName: 1, phoneNumber: 1 });
    
    console.log('MongoDB indexes created successfully');
  } catch (error) {
    console.error('Failed to initialize MongoDB:', error);
    throw error;
  }
}