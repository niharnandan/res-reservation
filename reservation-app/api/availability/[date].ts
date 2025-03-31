import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectToDatabase } from '../utils/mongodb';
import { parseISO } from 'date-fns';

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
    
    const { client, db } = await connectToDatabase();
    const bookingsCollection = db.collection('bookings');
    
    // Create date range for the query
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Find bookings for this date with confirmed status
    const existingBookings = await bookingsCollection.find({
      date: { $gte: startOfDay, $lte: endOfDay },
      status: "confirmed"
    }).toArray();
    
    console.log(`Found ${existingBookings.length} bookings for date ${dateParam}`);
    
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
    return res.status(500).json({ 
      error: 'Failed to fetch availability',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}