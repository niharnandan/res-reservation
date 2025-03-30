import express, { Request, Response } from 'express';
import { connectToDatabase } from '../utils/mongodb';
import { WithId, Document } from 'mongodb';

const router = express.Router();

// Define booking type to match your actual MongoDB schema
interface Booking {
  date: Date | string;
  time: string;
  customerName: string;
  phoneNumber: string;
  status: string;
}

// Define the response type expected by your frontend
interface AvailabilityResponse {
  date: string;
  availableTimeSlots: string[];
  bookedTimeSlots: string[];
  allTimeSlots: string[];
  isFullyBooked?: boolean;
}

// Get availability for a specific date
router.get('/:date', async (req: Request, res: Response) => {
  const requestDate = req.params.date; // Format: yyyy-MM-dd
  
  try {
    // Connect to MongoDB
    const { client } = await connectToDatabase();
    const database = client.db('restaurant-bookings');
    
    // Create start and end dates for the query
    const startDate = new Date(`${requestDate}T00:00:00.000Z`);
    const endDate = new Date(`${requestDate}T23:59:59.999Z`);
    
    console.log(`Checking availability between ${startDate.toISOString()} and ${endDate.toISOString()}`);
    
    // Get bookings for the specified date using date range
    const existingBookings = await database
      .collection('bookings')
      .find({
        date: { $gte: startDate, $lte: endDate },
        status: "confirmed" // Only count confirmed bookings
      })
      .toArray();
    
    console.log(`Found ${existingBookings.length} bookings for date ${requestDate}`);
    
    // Define the three specific time slots
    const allTimeSlots = ['12:30 PM', '4:30 PM', '8:30 PM'];
    
    // Get all booked time slots - with proper type casting
    const bookedTimeSlots = existingBookings.map(booking => {
      // Properly cast to unknown first, then to our type
      const typedBooking = booking as unknown as Booking;
      return typedBooking.time;
    });
    
    console.log('Booked time slots:', bookedTimeSlots);
    
    // Filter available time slots
    const availableTimeSlots = allTimeSlots.filter(
      timeSlot => !bookedTimeSlots.includes(timeSlot)
    );
    
    // Check if fully booked (no available slots)
    const isFullyBooked = availableTimeSlots.length === 0;
    
    const response: AvailabilityResponse = {
      date: requestDate,
      availableTimeSlots,
      bookedTimeSlots,
      allTimeSlots,
      isFullyBooked
    };
    
    return res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching availability:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch availability',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;