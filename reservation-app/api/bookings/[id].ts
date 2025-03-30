import { MongoClient, ObjectId } from 'mongodb';
import type { VercelRequest, VercelResponse } from '@vercel/node';

require('dotenv').config();
const uri = process.env.MONGODB_URI as string;
let cachedClient: MongoClient | null = null;

async function connectToDatabase(): Promise<MongoClient> {
  if (cachedClient) {
    return cachedClient;
  }

  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  const client = new MongoClient(uri);
  await client.connect();
  
  cachedClient = client;
  return client;
}

export default async function handler(
  req: VercelRequest, 
  res: VercelResponse
) {
  // Basic auth check (implement proper authentication in production)
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Get booking ID from the URL
  const id = req.query.id as string;
  
  if (!id || !ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid booking ID' });
  }
  
  try {
    const client = await connectToDatabase();
    const database = client.db('restaurant-bookings');
    const bookings = database.collection('bookings');
    
    // Handle different request methods
    switch (req.method) {
      case 'GET':
        // Get a specific booking
        const booking = await bookings.findOne({ _id: new ObjectId(id) });
        
        if (!booking) {
          return res.status(404).json({ error: 'Booking not found' });
        }
        
        return res.status(200).json(booking);
        
      case 'PUT':
        // Update a booking
        const { status } = req.body;
        
        if (!status || !['confirmed', 'cancelled', 'completed'].includes(status)) {
          return res.status(400).json({ error: 'Invalid status. Use confirmed, cancelled, or completed' });
        }
        
        const updateResult = await bookings.updateOne(
          { _id: new ObjectId(id) },
          { $set: { status, updatedAt: new Date() } }
        );
        
        if (updateResult.matchedCount === 0) {
          return res.status(404).json({ error: 'Booking not found' });
        }
        
        return res.status(200).json({ success: true });
        
      case 'DELETE':
        // Delete a booking
        const deleteResult = await bookings.deleteOne({ _id: new ObjectId(id) });
        
        if (deleteResult.deletedCount === 0) {
          return res.status(404).json({ error: 'Booking not found' });
        }
        
        return res.status(200).json({ success: true });
        
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error(`Error handling booking ${id}:`, error);
    return res.status(500).json({ error: 'Server error' });
  }
}