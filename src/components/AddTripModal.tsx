import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  IconButton,
  Checkbox,
  FormControlLabel,
  TextareaAutosize
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface TripFormData {
  fromCity: string;
  toCity: string;
  layoverCity: string;
  flightDate: string;
  flightTime: string;
  isBooked: boolean;
  flightDetails: string;
}

interface TripFormErrors {
  fromCity?: string;
  toCity?: string;
  layoverCity?: string;
  flightDate?: string;
  flightTime?: string;
  flightDetails?: string;
}

interface AddTripModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const AddTripModal: React.FC<AddTripModalProps> = ({ open, onClose, onSubmit }) => {
  // Form state
  const [formData, setFormData] = useState<TripFormData>({
    fromCity: '',
    toCity: '',
    layoverCity: '',
    flightDate: '',
    flightTime: '',
    isBooked: false,
    flightDetails: ''
  });
  
  const [errors, setErrors] = useState<TripFormErrors>({});

  // Reset form function
  const resetForm = () => {
    setFormData({
      fromCity: '',
      toCity: '',
      layoverCity: '',
      flightDate: '',
      flightTime: '',
      isBooked: false,
      flightDetails: ''
    });
    setErrors({});
  };

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Special handling for city codes - convert to uppercase and allow only letters
    if (name === 'fromCity' || name === 'toCity' || name === 'layoverCity') {
      const formattedValue = value.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 3);
      setFormData({
        ...formData,
        [name]: formattedValue
      });
    } else if (name === 'flightDetails' && value.length <= 250) {
      // Limit flight details to 250 characters
      setFormData({
        ...formData,
        [name]: value
      });
    } else if (name !== 'flightDetails') {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  // Handle checkbox change
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      isBooked: e.target.checked
    });
  };

  // Run validation when isBooked changes
  useEffect(() => {
    // Clear date and time errors when booking status changes
    if (!formData.isBooked) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.flightDate;
        delete newErrors.flightTime;
        return newErrors;
      });
    }
  }, [formData.isBooked]);

  // Validate the form
  const validateForm = (): boolean => {
    const newErrors: TripFormErrors = {};
    
    // Validate From City
    if (!formData.fromCity) {
      newErrors.fromCity = 'From City is required';
    } else if (formData.fromCity.length !== 3) {
      newErrors.fromCity = 'City code must be 3 characters';
    }
    
    // Validate To City
    if (!formData.toCity) {
      newErrors.toCity = 'To City is required';
    } else if (formData.toCity.length !== 3) {
      newErrors.toCity = 'City code must be 3 characters';
    }
    
    // Validate Layover City if provided
    if (formData.layoverCity && formData.layoverCity.length !== 3) {
      newErrors.layoverCity = 'City code must be 3 characters';
    }
    
    // Conditional validation for Flight Date and Time
    if (formData.isBooked) {
      if (!formData.flightDate) {
        newErrors.flightDate = 'Flight Date is required when booking is confirmed';
      }
      
      if (!formData.flightTime) {
        newErrors.flightTime = 'Flight Time is required when booking is confirmed';
      }
    }
    
    // Validate flight details length
    if (formData.flightDetails && formData.flightDetails.length > 250) {
      newErrors.flightDetails = 'Flight Details must be 250 characters or less';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Format date to DD-MON-YYYY
  const formatDateForDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const year = date.getFullYear();
    
    return `${day}-${month}-${year}`;
  };

  // Format time to HH:MM AM/PM
  const formatTimeForDisplay = (timeStr: string) => {
    if (!timeStr) return '';
    
    const [hours, minutes] = timeStr.split(':');
    const hoursNum = parseInt(hours, 10);
    const ampm = hoursNum >= 12 ? 'PM' : 'AM';
    const hours12 = hoursNum % 12 || 12;
    
    return `${hours12.toString().padStart(2, '0')}:${minutes} ${ampm}`;
  };

  // Handle form submission
  const handleSubmit = () => {
    if (validateForm()) {
      const formattedData = {
        ...formData,
        flightDate: formatDateForDisplay(formData.flightDate),
        flightTime: formatTimeForDisplay(formData.flightTime)
      };
      
      onSubmit(formattedData);
      resetForm(); // Reset form after successful submission
    }
  };

  // Reset form when modal is closed
  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'white'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #eee',
        pb: 1,
        color: 'black'
      }}>
        <Typography variant="h6" component="div" sx={{ color: 'black' }}>
          Create a Travel Record
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          size="small"
          sx={{ color: 'black' }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Box component="form" noValidate>
          {/* From City */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body1" sx={{ mb: 0.5, color: 'black' }}>
              From City* (3-letter code)
            </Typography>
            <TextField
              fullWidth
              name="fromCity"
              value={formData.fromCity}
              onChange={handleChange}
              error={!!errors.fromCity}
              helperText={errors.fromCity}
              inputProps={{ 
                style: { textTransform: 'uppercase', color: 'black' } 
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'white',
                  '& fieldset': {
                    borderColor: '#ccc',
                  },
                  '&:hover fieldset': {
                    borderColor: '#999',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'rgb(26, 150, 152)',
                  },
                },
                '& .MuiFormHelperText-root': {
                  color: '#f44336',
                },
                '& .MuiInputBase-input': {
                  color: 'black',
                }
              }}
            />
          </Box>
          
          {/* To City */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body1" sx={{ mb: 0.5, color: 'black' }}>
              To City* (3-letter code)
            </Typography>
            <TextField
              fullWidth
              name="toCity"
              value={formData.toCity}
              onChange={handleChange}
              error={!!errors.toCity}
              helperText={errors.toCity}
              inputProps={{ 
                style: { textTransform: 'uppercase', color: 'black' } 
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'white',
                  '& fieldset': {
                    borderColor: '#ccc',
                  },
                  '&:hover fieldset': {
                    borderColor: '#999',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'rgb(26, 150, 152)',
                  },
                },
                '& .MuiFormHelperText-root': {
                  color: '#f44336',
                },
                '& .MuiInputBase-input': {
                  color: 'black',
                }
              }}
            />
          </Box>
          
          {/* Layover City */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body1" sx={{ mb: 0.5, color: 'black' }}>
              Layover City (optional, 3-letter code)
            </Typography>
            <TextField
              fullWidth
              name="layoverCity"
              value={formData.layoverCity}
              onChange={handleChange}
              error={!!errors.layoverCity}
              helperText={errors.layoverCity}
              inputProps={{ 
                style: { textTransform: 'uppercase', color: 'black' } 
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'white',
                  '& fieldset': {
                    borderColor: '#ccc',
                  },
                  '&:hover fieldset': {
                    borderColor: '#999',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'rgb(26, 150, 152)',
                  },
                },
                '& .MuiFormHelperText-root': {
                  color: '#f44336',
                },
                '& .MuiInputBase-input': {
                  color: 'black',
                }
              }}
            />
          </Box>
          
          {/* Booking Confirmed */}
          <Box sx={{ mb: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.isBooked}
                  onChange={handleCheckboxChange}
                  name="isBooked"
                  sx={{ 
                    color: 'black',
                    '&.Mui-checked': {
                      color: 'rgb(26, 150, 152)',
                    }
                  }}
                />
              }
              label={<Typography sx={{ color: 'black' }}>Booking Confirmed?</Typography>}
            />
          </Box>
          
          {/* Flight Date */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body1" sx={{ mb: 0.5, color: 'black' }}>
              Flight Date {formData.isBooked && '*'} (DD-MON-YYYY)
            </Typography>
            <TextField
              fullWidth
              type="date"
              name="flightDate"
              value={formData.flightDate}
              onChange={handleChange}
              error={!!errors.flightDate}
              helperText={errors.flightDate}
              required={formData.isBooked}
              InputLabelProps={{ shrink: true }}
              inputProps={{ 
                style: { color: 'black' } 
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'white',
                  '& fieldset': {
                    borderColor: '#ccc',
                  },
                  '&:hover fieldset': {
                    borderColor: '#999',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'rgb(26, 150, 152)',
                  },
                },
                '& .MuiFormHelperText-root': {
                  color: '#f44336',
                },
                '& .MuiInputBase-input': {
                  color: 'black',
                }
              }}
            />
          </Box>
          
          {/* Flight Time */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body1" sx={{ mb: 0.5, color: 'black' }}>
              Time {formData.isBooked && '*'} (HH:MM AM/PM)
            </Typography>
            <TextField
              fullWidth
              type="time"
              name="flightTime"
              value={formData.flightTime}
              onChange={handleChange}
              error={!!errors.flightTime}
              helperText={errors.flightTime}
              required={formData.isBooked}
              InputLabelProps={{ shrink: true }}
              inputProps={{ 
                style: { color: 'black' } 
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'white',
                  '& fieldset': {
                    borderColor: '#ccc',
                  },
                  '&:hover fieldset': {
                    borderColor: '#999',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'rgb(26, 150, 152)',
                  },
                },
                '& .MuiFormHelperText-root': {
                  color: '#f44336',
                },
                '& .MuiInputBase-input': {
                  color: 'black',
                }
              }}
            />
          </Box>
          
          {/* Flight Details */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body1" sx={{ mb: 0.5, color: 'black' }}>
              Flight Details (max 250 chars)
            </Typography>
            <TextareaAutosize
              minRows={3}
              maxRows={5}
              name="flightDetails"
              value={formData.flightDetails}
              onChange={handleChange}
              style={{ 
                width: '100%', 
                padding: '8px 12px',
                fontFamily: 'inherit',
                fontSize: '1rem',
                borderColor: errors.flightDetails ? 'red' : '#ccc',
                borderRadius: '4px',
                resize: 'vertical',
                backgroundColor: 'white',
                color: 'black'
              }}
            />
            {errors.flightDetails && (
              <Typography color="error" variant="caption" sx={{ mt: 0.5 }}>
                {errors.flightDetails}
              </Typography>
            )}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button 
          variant="contained" 
          onClick={handleSubmit}
          sx={{
            bgcolor: 'rgb(26, 150, 152)',
            color: 'white',
            '&:hover': {
              bgcolor: 'rgb(21, 120, 120)',
            }
          }}
        >
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddTripModal; 