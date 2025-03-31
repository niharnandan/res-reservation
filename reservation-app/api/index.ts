// api/index.ts
import express, { Request, Response } from 'express';
import { connectToDatabase } from './utils/mongodb';
import { parseISO, startOfWeek, endOfWeek } from 'date-fns';
import { ObjectId } from 'mongodb';

// Create Express app
const app = express();
app.use(express.json());

// Database connection (reused across requests)
let dbConnection: any = null;

// Initialize database connection
const initDb = async () => {
  if (!dbConnection) {
    dbConnection = await connectToDatabase();
    console.log('Database connection initialized for Express app');
  }
  return dbConnection;
};

// Availability endpoint
app.get('/api/availability/:date', async (req: Request, res: Response) => {
  try {
    const dateParam = req.params.date; // Format expected: YYYY-MM-DD
    const date = parseISO(dateParam);
    
    // All available time slots
    const allTimeSlots = ['12:30 PM', '4:30 PM', '8:30 PM'];
    
    // Get database connection
    const { db } = await initDb();
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
    }, {
      projection: { time: 1 } // Only fetch the time field for better performance
    }).toArray();
    
    // Get booked time slots
    const bookedTimeSlots = existingBookings.map((booking: { time: any; }) => booking.time);
    
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
});

// Bookings endpoints
app.post('/api/bookings', async (req: Request, res: Response) => {
  try {
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
    
    // Get database connection
    const { db } = await initDb();
    const bookingsCollection = db.collection('bookings');
    
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
      time,
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
  } catch (error) {
    console.error('Error in bookings API:', error);
    return res.status(500).json({
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get all bookings (admin endpoint)
app.get('/api/bookings', async (req: Request, res: Response) => {
  try {
    // Get database connection
    const { db } = await initDb();
    const bookingsCollection = db.collection('bookings');
    
    const bookings = await bookingsCollection.find({})
      .sort({ date: 1, time: 1 })
      .toArray();
    
    return res.status(200).json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// Get, update or delete a specific booking by ID
app.get('/api/bookings/:id', async (req: Request, res: Response) => {
  const id = req.params.id;
  
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid booking ID' });
  }
  
  try {
    // Get database connection
    const { db } = await initDb();
    const bookingsCollection = db.collection('bookings');
    
    // Get a specific booking
    const booking = await bookingsCollection.findOne({ _id: new ObjectId(id) });
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    return res.status(200).json(booking);
  } catch (error) {
    console.error(`Error retrieving booking ${id}:`, error);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/bookings/:id', async (req: Request, res: Response) => {
  const id = req.params.id;
  
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid booking ID' });
  }
  
  try {
    const { status } = req.body;
    
    if (!status || !['confirmed', 'cancelled', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Use confirmed, cancelled, or completed' });
    }
    
    // Get database connection
    const { db } = await initDb();
    const bookingsCollection = db.collection('bookings');
    
    const updateResult = await bookingsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { status, updatedAt: new Date() } }
    );
    
    if (updateResult.matchedCount === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(`Error updating booking ${id}:`, error);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/bookings/:id', async (req: Request, res: Response) => {
  const id = req.params.id;
  
  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid booking ID' });
  }
  
  try {
    // Get database connection
    const { db } = await initDb();
    const bookingsCollection = db.collection('bookings');
    
    const deleteResult = await bookingsCollection.deleteOne({ _id: new ObjectId(id) });
    
    if (deleteResult.deletedCount === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error(`Error deleting booking ${id}:`, error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Status endpoint
app.get('/api/status', async (req: Request, res: Response) => {
  try {
    await initDb();
    return res.status(200).json({
      status: 'ok',
      message: 'Express app is running',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in status endpoint:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Create a Vercel handler function that passes requests to Express
module.exports = app;

// Also support serverless function format for compatibility
export default (req: any, res: any) => app(req, res);