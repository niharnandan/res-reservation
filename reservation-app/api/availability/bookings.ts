import { MongoClient, ObjectId } from 'mongodb';
import { parseISO, startOfWeek, endOfWeek } from 'date-fns';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Connection URI
const uri = process.env.MONGODB_URI as string;
let cachedClient: MongoClient | null = null;

interface BookingData {
  date: string;
  time: string;
  name: string;
  phone: string;
}

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
  if (req.method === 'POST') {
    // Create a new booking
    try {
      const { date, time, name, phone } = req.body as BookingData;
      
      if (!date || !time || !name || !phone) {
        return res.status(400).json({ error: 'All fields are required' });
      }
      
      const bookingDate = new Date(date);
      
      // Calculate expiration date (end of the week)
      const weekStart = startOfWeek(bookingDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      weekEnd.setHours(23, 59, 59, 999);
      
      const client = await connectToDatabase();
      const database = client.db('restaurant-bookings');
      const bookings = database.collection('bookings');
      
      // Check if this slot is already booked
      const existingBooking = await bookings.findOne({
        date: {
          $gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
          $lt: new Date(new Date(date).setHours(23, 59, 59, 999))
        },
        time: time
      });
      
      if (existingBooking) {
        return res.status(409).json({ error: 'This time slot is already booked' });
      }
      
      // Create the booking
      await bookings.insertOne({
        date: bookingDate,
        time,
        customerName: name,
        phoneNumber: phone,
        createdAt: new Date(),
        expiresAt: weekEnd
      });
      
      return res.status(201).json({ success: true });
    } catch (error) {
      console.error('Error creating booking:', error);
      return res.status(500).json({ error: 'Failed to create booking' });
    }
  } else {
    // Method not allowed
    return res.status(405).json({ error: 'Method not allowed' });
  }
}