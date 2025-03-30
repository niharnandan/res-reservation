import express, { Request, Response } from 'express';
import { connectToDatabase } from '../utils/mongodb';

const router = express.Router();
const DB_NAME = 'restaurant-bookings';
const COLLECTION_NAME = 'bookings';

// Frontend sends this format
interface BookingRequest {
  date: string;      // format: 'yyyy-MM-dd'
  time: string;      // '12:30 PM', '4:30 PM', or '8:30 PM'
  name: string;      // From BookingForm
  phone: string;     // From BookingForm
}

// Create a new booking
router.post('/', async (req: Request, res: Response) => {
  try {
    const bookingData = req.body as BookingRequest;
    
    // Validate required fields
    const requiredFields = ['date', 'time', 'name', 'phone'];
    for (const field of requiredFields) {
      if (!bookingData[field as keyof BookingRequest]) {
        return res.status(400).json({ 
          status: 'error',
          message: `Missing required field: ${field}`
        });
      }
    }
    
    // Connect to MongoDB
    const { client } = await connectToDatabase();
    
    // Explicitly specify the database
    const database = client.db(DB_NAME);
    console.log(`Using database: ${DB_NAME}, collection: ${COLLECTION_NAME}`);
    
    // Convert date string to Date object
    const bookingDate = new Date(`${bookingData.date}T${convertTo24Hour(bookingData.time)}`);
    const expiresAt = new Date(bookingDate);
    
    // Check if the time slot is already booked
    const startOfDay = new Date(`${bookingData.date}T00:00:00.000Z`);
    const endOfDay = new Date(`${bookingData.date}T23:59:59.999Z`);
    
    // IMPORTANT: Get a reference to the collection
    const bookingsCollection = database.collection(COLLECTION_NAME);
    
    // Check for existing booking
    const existingBooking = await bookingsCollection.findOne({ 
      date: { $gte: startOfDay, $lte: endOfDay },
      time: bookingData.time,
      status: "confirmed"
    });
    
    if (existingBooking) {
      return res.status(409).json({
        status: 'error',
        message: 'This time slot is already booked'
      });
    }
    
    // IMPORTANT: Use insertOne to add a new document to the collection
    // This correctly appends to the collection without replacing existing documents
    const newBooking = {
      date: bookingDate,
      time: bookingData.time,
      customerName: bookingData.name,
      phoneNumber: bookingData.phone,
      createdAt: new Date(),
      expiresAt: expiresAt,
      status: "confirmed"
    };
    
    console.log('Inserting new booking:', newBooking);
    
    // Use insertOne - this appends to the collection and doesn't replace it
    const result = await bookingsCollection.insertOne(newBooking);
    
    console.log(`Successfully inserted booking with ID: ${result.insertedId}`);
    
    return res.status(201).json({
      status: 'success',
      message: 'Booking created successfully',
      bookingId: result.insertedId
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create booking',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Get all bookings
router.get('/', async (_req: Request, res: Response) => {
  try {
    // Connect to MongoDB
    const { client } = await connectToDatabase();
    
    // Explicitly specify the database
    const database = client.db(DB_NAME);
    
    // Get a reference to the collection
    const bookingsCollection = database.collection(COLLECTION_NAME);
    
    // Find all bookings
    const bookings = await bookingsCollection
      .find({})
      .sort({ date: 1, time: 1 })
      .toArray();
    
    console.log(`Retrieved ${bookings.length} bookings from collection`);
    
    return res.status(200).json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch bookings',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// Helper function to convert '4:30 PM' to '16:30:00'
function convertTo24Hour(time12h: string): string {
  const [time, modifier] = time12h.split(' ');
  let [hours, minutes] = time.split(':');
  
  let hoursNum = parseInt(hours, 10);
  
  if (modifier === 'PM' && hoursNum < 12) {
    hoursNum += 12;
  }
  if (modifier === 'AM' && hoursNum === 12) {
    hoursNum = 0;
  }
  
  return `${hoursNum.toString().padStart(2, '0')}:${minutes}:00.000`;
}

export default router;