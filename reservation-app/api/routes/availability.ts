import { Router, Request, Response } from 'express';
import { parseISO } from 'date-fns';
import { connectToDatabase } from '../utils/mongodb';

const router = Router();

// GET /api/availability/:date - Check availability for a specific date
router.get('/:date', async (req: Request, res: Response) => {
  try {
    const dateParam = req.params.date;
    
    if (!dateParam || !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }
    
    const date = parseISO(dateParam);
    
    // All available time slots
    const allTimeSlots = ['12:30 PM', '4:30 PM', '8:30 PM'];
    
    const client = await connectToDatabase();
    const database = client.db('restaurant-bookings');
    const bookings = database.collection('bookings');
    
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
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;