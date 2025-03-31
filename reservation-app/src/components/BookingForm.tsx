import { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  Button,
  Typography,
  Grid,
  Box,
  Modal,
  ModalDialog,
  ModalClose,
  FormControl,
  FormLabel,
  Input,
  FormHelperText,
} from '@mui/joy';
import { format } from 'date-fns';

interface BookingFormData {
  name: string;
  phone: string;
}

interface BookingFormProps {
  open: boolean;
  selectedDate: Date | null;
  selectedTime: string | null;
  onClose: () => void;
  onSubmit: (data: BookingFormData) => Promise<boolean | undefined>;
  onBookingComplete: (status: 'confirmed' | 'failed') => void; // New prop
}

const BookingForm = ({ 
  open, 
  selectedDate, 
  selectedTime, 
  onClose, 
  onSubmit, 
  onBookingComplete 
}: BookingFormProps) => {
  const [bookingStatus, setBookingStatus] = useState<'pending' | 'confirmed' | 'failed'>('pending');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<BookingFormData>();

  const handleClose = () => {
    if (bookingStatus !== 'pending') {
      reset();
      setBookingStatus('pending');
      // Notify parent component about the booking status when closing
      if (bookingStatus === 'confirmed' || bookingStatus === 'failed') {
        onBookingComplete(bookingStatus);
      }
    }
    onClose();
  };

  const handleFormSubmit = async (data: BookingFormData) => {
    try {
      setIsSubmitting(true);
      setBookingStatus('pending'); // Reset to pending before submission

      const success = await onSubmit(data);
      if (success) {
        setBookingStatus('confirmed');
      } else {
        setBookingStatus('failed');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setBookingStatus('failed');
    } finally {
      setIsSubmitting(false); // Reset the loading state after submission attempt
    }
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <ModalDialog
        sx={{
          maxWidth: 500,
          borderRadius: 'md',
          p: 3,
          boxShadow: 'lg',
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          animation: open ? 'fadeIn 0.3s ease-out' : 'none',
          '@keyframes fadeIn': {
            '0%': {
              opacity: 0,
              transform: 'translate(-50%, -45%)',
            },
            '100%': {
              opacity: 1,
              transform: 'translate(-50%, -50%)',
            },
          },
        }}
      >
        <ModalClose />

        {bookingStatus === 'pending' ? (
          <>
            <Typography level="h2" component="h2" sx={{ mb: 2 }}>
              Complete Your Booking
            </Typography>

            <Typography level="body-md" sx={{ mb: 3 }}>
              {`Booking a table for ${selectedDate ? format(selectedDate, 'EEEE, MMM d') : ''} at ${selectedTime}`}
            </Typography>

            <form onSubmit={handleSubmit(handleFormSubmit)}>
              <Grid container spacing={2}>
                <Grid xs={12}>
                  <FormControl error={!!errors.name}>
                    <FormLabel>Full Name</FormLabel>
                    <Input
                      {...register('name', {
                        required: 'Name is required',
                        minLength: {
                          value: 2,
                          message: 'Name must be at least 2 characters',
                        },
                      })}
                      placeholder="Enter your full name"
                    />
                    {errors.name && <FormHelperText>{errors.name.message}</FormHelperText>}
                  </FormControl>
                </Grid>

                <Grid xs={12}>
                  <FormControl error={!!errors.phone}>
                    <FormLabel>Phone Number</FormLabel>
                    <Input
                      {...register('phone', {
                        required: 'Phone number is required',
                        pattern: {
                          // Validates common phone formats with optional country code
                          value: /^(\+?1[-\s.]?)?(\(?\d{3}\)?[-\s.]?)?\d{3}[-\s.]?\d{4}$/,
                          message: 'Please enter a valid phone number',
                        },
                      })}
                      placeholder="Enter your phone number"
                    />
                    {errors.phone && <FormHelperText>{errors.phone.message}</FormHelperText>}
                  </FormControl>
                </Grid>

                <Grid xs={12} sx={{ mt: 2 }}>
                  <Button
                    type="submit"
                    color="primary"
                    size="lg"
                    fullWidth
                    disabled={isSubmitting} // Disable button while submitting
                  >
                    {isSubmitting ? 'Submitting...' : 'Confirm Booking'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </>
        ) : bookingStatus === 'confirmed' ? (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography level="h2" component="h2" sx={{ mb: 2 }}>
              Booking Confirmed!
            </Typography>
            <Typography level="body-lg" sx={{ mb: 3 }}>
              {`Your table has been reserved for ${selectedDate ? format(selectedDate, 'EEEE, MMM d') : ''} at ${selectedTime}.`}
            </Typography>
            <Button color="primary" size="lg" onClick={handleClose}>
              Close
            </Button>
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography level="h2" component="h2" sx={{ mb: 2, color: 'danger' }}>
              Booking Failed
            </Typography>
            <Typography level="body-lg" sx={{ mb: 3 }}>
              There was an issue with your booking. Please try again later.
            </Typography>
            <Button color="danger" size="lg" onClick={handleClose}>
              Close
            </Button>
          </Box>
        )}
      </ModalDialog>
    </Modal>
  );
};

export default BookingForm;