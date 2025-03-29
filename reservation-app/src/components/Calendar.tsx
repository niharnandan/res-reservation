import { useState, useEffect } from 'react';
import { Button, Sheet, Typography, Grid, Box, CircularProgress } from '@mui/joy';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import BookingForm from './BookingForm';

interface BookingFormData {
  name: string;
  phone: string;
}

interface TimeSlot {
  time: string;
  isAvailable: boolean;
}

interface AvailabilityData {
  date: string;
  allTimeSlots: string[];
  availableTimeSlots: string[];
  bookedTimeSlots: string[];
  isFullyBooked: boolean;
}

const Calendar = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [availabilityData, setAvailabilityData] = useState<Record<string, AvailabilityData>>({});
  const [displayTimeSlots, setDisplayTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const today = new Date();
  const monday = startOfWeek(today, { weekStartsOn: 1 });

  const weekdays: Date[] = [];
  for (let i = 0; i < 5; i++) {
    weekdays.push(addDays(monday, i));
  }

  const defaultTimeSlots = ['12:30 PM', '4:30 PM', '8:30 PM'];

  useEffect(() => {
    const loadAllAvailability = async () => {
      for (const day of weekdays) {
        await fetchAvailability(day);
      }
    };

    loadAllAvailability();
  }, []);

  const fetchAvailability = async (date: Date) => {
    try {
      setIsLoading(true);
      const formattedDate = format(date, 'yyyy-MM-dd');

      if (availabilityData[formattedDate]) {
        if (selectedDate && isSameDay(date, selectedDate)) {
          updateDisplayTimeSlots(availabilityData[formattedDate]);
        }
        return;
      }

      const response = await fetch(`/api/availability/${formattedDate}`);
      if (!response.ok) {
        throw new Error('Failed to fetch availability');
      }

      const data: AvailabilityData = await response.json();

      setAvailabilityData(prev => ({
        ...prev,
        [formattedDate]: data,
      }));

      if (selectedDate && isSameDay(date, selectedDate)) {
        updateDisplayTimeSlots(data);
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
      if (selectedDate && isSameDay(date, selectedDate)) {
        setDisplayTimeSlots(defaultTimeSlots.map(time => ({ time, isAvailable: true })));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateDisplayTimeSlots = (data: AvailabilityData) => {
    setDisplayTimeSlots(
      data.allTimeSlots.map(time => ({
        time,
        isAvailable: data.availableTimeSlots.includes(time),
      }))
    );
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null);

    const formattedDate = format(date, 'yyyy-MM-dd');
    if (availabilityData[formattedDate]) {
      updateDisplayTimeSlots(availabilityData[formattedDate]);
    } else {
      fetchAvailability(date);
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const openBookingForm = () => {
    setIsFormOpen(true);
  };

  const closeBookingForm = () => {
    setIsFormOpen(false);
  };

  const handleFormSubmit = async (data: BookingFormData): Promise<boolean> => {
    if (!selectedDate || !selectedTime) return false;

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: format(selectedDate, 'yyyy-MM-dd'),
          time: selectedTime,
          name: data.name,
          phone: data.phone,
        }),
      });

      if (!response.ok) {
        console.error('Booking failed:', await response.json());
        return false;
      }

      await fetchAvailability(selectedDate);

      for (const day of weekdays) {
        await fetchAvailability(day);
      }

      return true;
    } catch (error) {
      console.error('Error creating booking:', error);
      return false;
    }
  };

  const isDateFullyBooked = (date: Date) => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    return availabilityData[formattedDate]?.isFullyBooked || false;
  };

  return (
    <>
      <Sheet
        sx={{
          padding: 3,
          borderRadius: 'md',
          boxShadow: 'sm',
          width: '100%',
          maxWidth: '500px',
          minWidth: '300px',
          margin: '0 auto',
        }}
      >
        <Typography level="h2" sx={{ marginBottom: 2, textAlign: 'center' }} component="div">
          This Week
        </Typography>

        <Grid container spacing={2} sx={{ mb: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
          {weekdays.map((day, index) => (
            <Grid xs={12} sm={2.4} key={index}>
              <Box
                sx={{
                  textAlign: 'center',
                  height: '80px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography
                  level="body-sm"
                  component="div"
                  sx={{
                    whiteSpace: 'nowrap',
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
                  disabled={isDateFullyBooked(day)}
                  sx={{
                    width: '100%',
                    height: '40px',
                    ...(isDateFullyBooked(day) && {
                      opacity: 0.5,
                    }),
                  }}
                  onClick={() => handleDateSelect(day)}
                >
                  {format(day, 'd')}
                </Button>
              </Box>
            </Grid>
          ))}
        </Grid>

        {selectedDate && (
          <Box sx={{ mt: 3 }}>
            <Typography level="h3" sx={{ mb: 2, textAlign: 'center' }} component="div" noWrap>
              {`Select a time for ${format(selectedDate, 'EEEE, MMM d')}`}
            </Typography>

            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Grid container spacing={2} sx={{ flexWrap: 'wrap', justifyContent: 'center' }}>
                {displayTimeSlots.map(slot => (
                  <Grid xs={12} sm={4} key={slot.time}>
                    <Button
                      variant={selectedTime === slot.time ? 'solid' : 'outlined'}
                      color={selectedTime === slot.time ? 'warning' : 'neutral'}
                      disabled={!slot.isAvailable}
                      sx={{
                        width: '100%',
                        height: '40px',
                        ...(selectedTime === slot.time && {
                          backgroundColor: '#ff9800',
                          color: 'white',
                          '&:hover': {
                            backgroundColor: '#ed8c00',
                          },
                        }),
                        ...(!slot.isAvailable && {
                          opacity: 0.5,
                        }),
                      }}
                      onClick={() => handleTimeSelect(slot.time)}
                    >
                      {slot.time}
                    </Button>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}

        {selectedDate && selectedTime && (
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Button
              variant="solid"
              color="primary"
              size="lg"
              sx={{
                width: '100%',
                height: '48px',
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
        onClose={closeBookingForm}
        onSubmit={handleFormSubmit}
      />
    </>
  );
};

export default Calendar;
