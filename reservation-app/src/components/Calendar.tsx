import React, { useState } from 'react';
import { Button, Sheet, Typography, Grid, Box } from '@mui/joy';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import BookingForm from './BookngForm';

// Interface for the form data
interface BookingFormData {
  name: string;
  phone: string;
}

const Calendar: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Get the current date
  const today = new Date();

  // Get the current week's Monday
  const monday = startOfWeek(today, { weekStartsOn: 1 });

  // Generate weekdays (Monday to Friday)
  const weekdays = [];
  for (let i = 0; i < 5; i++) {
    weekdays.push(addDays(monday, i));
  }

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null); // Reset selected time when a new date is chosen
  };

  // Handle time selection
  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  // Open booking form
  const openBookingForm = () => {
    setIsFormOpen(true);
  };

  // Close booking form
  const closeBookingForm = () => {
    setIsFormOpen(false);
  };

  // Close form without resetting selected date and time
  const handleFormClose = () => {
    closeBookingForm();
    // We're not resetting the date and time so they remain selected when form is closed
  };

  // Handle form submission
  const handleFormSubmit = (data: BookingFormData) => {
    console.log('Booking details:', {
      date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null,
      time: selectedTime,
      customer: data,
    });

    // In a real application, you would send this data to your backend
    // After successful submission form will show confirmation (handled inside the form component)
  };

  // Available time slots
  const timeSlots = ['12:30 PM', '4:30 PM', '8:30 PM'];

  return (
    <>
      <Sheet
        sx={{
          padding: 3,
          borderRadius: 'md',
          boxShadow: 'sm',
          width: '500px', // Fixed width
          minWidth: '500px',
        }}
      >
        <Typography level="h2" sx={{ marginBottom: 2 }} component="div">
          This Week
        </Typography>

        {/* Display weekdays (Monday-Friday) */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {weekdays.map((day, index) => (
            <Grid xs={2.4} key={index}>
              <Box
                sx={{
                  textAlign: 'center',
                  height: '80px', // Fixed height for day containers
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <Typography
                  level="body-sm"
                  component="div"
                  sx={{
                    whiteSpace: 'nowrap', // Prevent text wrapping
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    mb: 1,
                  }}
                >
                  {format(day, 'EEEE')}
                </Typography>
                <Button
                  variant={selectedDate && isSameDay(day, selectedDate) ? 'solid' : 'outlined'}
                  color="primary"
                  sx={{
                    width: '100%',
                    height: '40px', // Fixed height for buttons
                  }}
                  onClick={() => handleDateSelect(day)}
                >
                  {format(day, 'd')}
                </Button>
              </Box>
            </Grid>
          ))}
        </Grid>

        {/* Display times only after a date is selected */}
        {selectedDate && (
          <Box sx={{ mt: 3 }}>
            <Typography
              level="h3"
              sx={{ mb: 2 }}
              component="div"
              noWrap // Prevent wrapping
            >
              {`Select a time for ${format(selectedDate, 'EEEE, MMM d')}`}
            </Typography>
            <Grid container spacing={2}>
              {timeSlots.map(time => (
                <Grid xs={4} key={time}>
                  <Button
                    variant={selectedTime === time ? 'solid' : 'outlined'}
                    color={selectedTime === time ? 'warning' : 'neutral'} // Change to orange when selected
                    sx={{
                      width: '100%',
                      height: '40px', // Fixed height
                      ...(selectedTime === time && {
                        backgroundColor: '#ff9800', // Custom orange
                        color: 'white',
                        '&:hover': {
                          backgroundColor: '#ed8c00', // Slightly darker on hover
                        },
                      }),
                    }}
                    onClick={() => handleTimeSelect(time)}
                  >
                    {time}
                  </Button>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Show "Book Table" button only when both date and time are selected */}
        {selectedDate && selectedTime && (
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Button
              variant="solid"
              color="primary"
              size="lg"
              sx={{
                width: '100%',
                height: '48px', // Fixed height
              }}
              onClick={openBookingForm}
            >
              {`Book Table for ${format(selectedDate, 'MMM d')} at ${selectedTime}`}
            </Button>
          </Box>
        )}
      </Sheet>

      <BookingForm
        open={isFormOpen}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
      />
    </>
  );
};

export default Calendar;
