import { MongoClient } from 'mongodb';
import type { VercelRequest, VercelResponse } from '@vercel/node';

require('dotenv').config();
const uri = process.env.MONGODB_URI as string;

export default async function handler(
  req: VercelRequest, 
  res: VercelResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!uri) {
    return res.status(500).json({ 
      status: 'error',
      message: 'MONGODB_URI environment variable is not set'
    });
  }

  let client: MongoClient | null = null;
  
  try {
    // Try to connect to MongoDB
    client = new MongoClient(uri);
    await client.connect();
    
    // Ping the database
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
    // Close the connection
    if (client) {
      await client.close();
    }
  }
}