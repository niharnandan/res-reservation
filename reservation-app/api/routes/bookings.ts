import { Router, Request, Response } from 'express';
import { parseISO, startOfWeek, endOfWeek } from 'date-fns';
import { connectToDatabase } from '../utils/mongodb';
import { ObjectId } from 'mongodb';

const router = Router();

// POST /api/bookings - Create a new booking
router.post('/', async (req: Request, res: Response) => {
  try {
    console.log('Received booking request:', req.body);
    const { date, time, name, phone } = req.body;
    
    if (!date || !time || !name || !phone) {
      console.error('Missing required fields:', { date, time, name, phone });
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    // Validate phone number format
    const phoneRegex = /^(\+?1[-\s.]?)?(\(?\d{3}\)?[-\s.]?)?\d{3}[-\s.]?\d{4}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }
    
    const bookingDate = parseISO(date);
    
    // Calculate expiration date (end of the week)
    const weekStart = startOfWeek(bookingDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    weekEnd.setHours(23, 59, 59, 999);
    
    const client = await connectToDatabase();
    const database = client.db('restaurant-bookings');
    const bookings = database.collection('bookings');
    
    // Format date for consistent querying
    const startOfDay = new Date(bookingDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(bookingDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    // Check if this slot is already booked
    const existingBooking = await bookings.findOne({
      date: {
        $gte: startOfDay,
        $lt: endOfDay
      },
      time: time
    });
    
    if (existingBooking) {
      console.error('Time slot already booked:', { date, time });
      return res.status(409).json({ error: 'This time slot is already booked' });
    }
    
    // Create the booking
    console.log('Creating new booking for:', { date: bookingDate, time, name, phone });
    const result = await bookings.insertOne({
      date: bookingDate,
      time,
      customerName: name,
      phoneNumber: phone,
      createdAt: new Date(),
      expiresAt: weekEnd,
      status: 'confirmed'
    });
    
    console.log('Booking created successfully with ID:', result.insertedId.toString());
    return res.status(201).json({ 
      success: true, 
      bookingId: result.insertedId.toString() 
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    return res.status(500).json({ 
      error: 'Failed to create booking',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// GET /api/bookings - Get all bookings (admin only)
router.get('/', async (req: Request, res: Response) => {
  try {
    // Note: In production, you would implement proper authentication here
    // This is a simple placeholder for demo purposes
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const client = await connectToDatabase();
    const database = client.db('restaurant-bookings');
    const bookings = database.collection('bookings');
    
    // Get bookings for the current week only
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    weekEnd.setHours(23, 59, 59, 999);
    
    const allBookings = await bookings.find({
      date: {
        $gte: weekStart,
        $lte: weekEnd
      }
    }).sort({ date: 1, time: 1 }).toArray();
    
    return res.status(200).json(allBookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch bookings',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;