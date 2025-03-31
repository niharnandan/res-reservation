import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectToDatabase } from './utils/mongodb';
import { parseISO, startOfWeek, endOfWeek } from 'date-fns';

export default async function handler(
  req: VercelRequest, 
  res: VercelResponse
) {
  try {
    const { client, db } = await connectToDatabase();
    const bookingsCollection = db.collection('bookings');

    // GET - Fetch all bookings (admin only)
    if (req.method === 'GET') {
      const bookings = await bookingsCollection
        .find({})
        .sort({ date: 1, time: 1 })
        .toArray();
      
      return res.status(200).json(bookings);
    }
    
    // POST - Create a new booking
    if (req.method === 'POST') {
      const { date, time, name, phone } = req.body;
      
      // Validate required fields
      if (!date || !time || !name || !phone) {
        return res.status(400).json({ error: 'All fields are required' });
      }
      
      const bookingDate = new Date(date);
      
      // Calculate expiration date (end of the week)
      const weekStart = startOfWeek(bookingDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      weekEnd.setHours(23, 59, 59, 999);
      
      // Check if this slot is already booked
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      const existingBooking = await bookingsCollection.findOne({
        date: { $gte: startOfDay, $lte: endOfDay },
        time: time,
        status: "confirmed"
      });
      
      if (existingBooking) {
        return res.status(409).json({ error: 'This time slot is already booked' });
      }
      
      // Create a new booking document
      const newBooking = {
        date: bookingDate,
        time: time,
        customerName: name,
        phoneNumber: phone,
        createdAt: new Date(),
        expiresAt: weekEnd,
        status: "confirmed"
      };
      
      // Insert the new booking
      const result = await bookingsCollection.insertOne(newBooking);
      
      return res.status(201).json({
        status: 'success',
        bookingId: result.insertedId
      });
    }
    
    // Method not allowed
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Error in bookings API:', error);
    return res.status(500).json({
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}