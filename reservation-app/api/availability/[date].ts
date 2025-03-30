import { parseISO } from 'date-fns';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { connectToDatabase } from '../utils/mongodb';

export default async function handler(
  req: VercelRequest, 
  res: VercelResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const dateParam = req.query.date as string; // Format expected: YYYY-MM-DD
    
    if (!dateParam || !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }
    
    const date = parseISO(dateParam);
    
    // All available time slots
    const allTimeSlots = ['12:30 PM', '4:30 PM', '8:30 PM'];
    
    // Use the central connection management
    const { client, db } = await connectToDatabase();
    const bookings = db.collection('bookings');
    
    // Find bookings for this date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const existingBookings = await bookings.find({
      date: {
        $gte: startOfDay,
        $lt: endOfDay
      }
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
    return res.status(500).json({ error: 'Failed to fetch availability' });
  }
}