import { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';

// Import your existing routes
import availabilityRoutes from './routes/availability';
import bookingsRoutes from './routes/bookings';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection setup
let cachedClient: MongoClient | null = null;

async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient;
  }

  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  const client = new MongoClient(uri, {
    // Recommended options for serverless environments
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000
  });
  
  await client.connect();
  
  cachedClient = client;
  return client;
}

// Use your existing routes
app.use('/api/availability', availabilityRoutes);
app.use('/api/bookings', bookingsRoutes);

// Health check endpoint
app.get('/api/status', async (_req, res) => {
  try {
    const client = await connectToDatabase();
    res.status(200).json({
      status: 'ok',
      message: 'MongoDB connection successful',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.error('MongoDB connection error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to connect to MongoDB',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Serverless handler for Vercel
export default async (req: VercelRequest, res: VercelResponse) => {
  // Initialize MongoDB for each request (if not already connected)
  try {
    await connectToDatabase();
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    // Continue processing the request even if DB connection fails
    // The route handlers will handle DB errors appropriately
  }
  
  // Make Express work with Vercel's serverless environment
  return new Promise((resolve, reject) => {
    app(req, res, (err: any) => {
      if (err) {
        return reject(err);
      }
      resolve(undefined);
    });
  });
};