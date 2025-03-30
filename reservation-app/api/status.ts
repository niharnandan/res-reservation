import type { VercelRequest, VercelResponse } from '@vercel/node';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Initialize environment variables
dotenv.config();

export default async function handler(
  req: VercelRequest, 
  res: VercelResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('MONGODB_URI environment variable is not set');
    return res.status(500).json({ 
      status: 'error',
      message: 'MONGODB_URI environment variable is not set'
    });
  }

  let client: MongoClient | null = null;
  
  try {
    // Create MongoDB client with options optimized for serverless
    client = new MongoClient(uri, {
      maxPoolSize: 1,
      serverSelectionTimeoutMS: 5000
    });
    
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('Connected to MongoDB');
    
    // Ping the database to verify connection
    await client.db('restaurant-bookings').command({ ping: 1 });
    
    return res.status(200).json({
      status: 'ok',
      message: 'MongoDB connection successful',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to connect to MongoDB',
      error: error instanceof Error ? error.message : String(error)
    });
  } finally {
    if (client) {
      await client.close();
      console.log('MongoDB connection closed');
    }
  }
}