import { MongoClient } from 'mongodb';
import { parseISO } from 'date-fns';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Connection URI
const uri = process.env.MONGODB_URI as string;
let cachedClient: MongoClient | null = null;

async function connectToDatabase(): Promise<MongoClient> {
  if (cachedClient) {
    return cachedClient;
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
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const dateParam = req.query.date as string; // Format expected: YYYY-MM-DD
    const date = parseISO(dateParam);
    
    // All available time slots
    const allTimeSlots = ['12:30 PM', '4:30 PM', '8:30 PM'];
    
    const client = await connectToDatabase();
    const database = client.db('restaurant-bookings');
    const bookings = database.collection('bookings');
    
    // Find bookings for this date
    const existingBookings = await bookings.find({
      date: {
        $gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
        $lt: new Date(new Date(date).setHours(23, 59, 59, 999))
      }
    }).toArray();
    
    // Get booked time slots
    const bookedTimeSlots = existingBookings.map(booking => booking.time);
    
    // Get available time slots
    const availableTimeSlots = allTimeSlots.filter(
      time => !bookedTimeSlots.includes(time)
    );
    
    // Return availability info
    return res.status(200).json({
      date: dateParam,
      allTimeSlots,
      availableTimeSlots,
      bookedTimeSlots,
      isFullyBooked: availableTimeSlots.length === 0
    });
  } catch (error) {
    console.error('Error fetching availability:', error);
    return res.status(500).json({ error: 'Failed to fetch availability' });
  }
}