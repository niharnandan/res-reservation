import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import { initializeMongoDB } from './utils/mongodb';

// Import routes
import availabilityRoutes from './routes/availability';
import bookingsRoutes from './routes/bookings';

require('dotenv').config();

console.log('MONGODB_URI:', process.env.MONGODB_URI! ? 'is set' : 'is NOT set', process.env.MONGODB_URI);

// Create Express app
const app = express();
const port = process.env.API_PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
let cachedClient: MongoClient | null = null;

// API Routes
app.use('/api/availability', availabilityRoutes);
app.use('/api/bookings', bookingsRoutes);

// Simple health check endpoint
app.get('/api/status', async (_req, res) => {
  try {
    // Initialize MongoDB with indexes
    await initializeMongoDB();
    
    res.status(200).json({
      status: 'ok',
      message: 'MongoDB connection successful',
      timestamp: new Date().toISOString()
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

// Start the server
app.listen(port, async () => {
  try {
    // Initialize MongoDB on server start
    await initializeMongoDB();
    console.log('MongoDB initialized successfully');
    console.log(`Server running at http://localhost:${port}`);
  } catch (error) {
    console.error('Failed to initialize MongoDB:', error);
  }
});