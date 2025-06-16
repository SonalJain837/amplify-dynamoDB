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
  TextareaAutosize,
  Autocomplete
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { type Schema } from '../../amplify/data/resource';

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
  // Added to handle potential errors from Autocomplete interactions or other form fields
  [key: string]: string | undefined;
}

interface AddTripModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  airportData: Schema["Airports"]["type"][];
}

const AddTripModal: React.FC<AddTripModalProps> = ({ open, onClose, onSubmit, airportData }) => {
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

    if (name === 'layoverCity') {
      const formattedValue = value.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 3);
      setFormData({
        ...formData,
        [name]: formattedValue
      });
    } else if (name === 'flightDetails' && value.length <= 250) {
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

  // Handle Autocomplete change for From City and To City
  const handleCityAutocompleteChange = (fieldName: keyof Pick<TripFormData, 'fromCity' | 'toCity'>) => 
    (event: React.SyntheticEvent, value: { label: string; IATA: string } | null) => {
      setFormData({
        ...formData,
        [fieldName]: value ? value.IATA : '',
      });
      // Clear error for the field if a valid selection is made
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
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
    
    // Validate Flight Date (now mandatory)
    if (!formData.flightDate) {
      newErrors.flightDate = 'Flight Date is required';
    } else {
      // Get today's date at midnight for comparison
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Convert flight date to Date object
      const flightDate = new Date(formData.flightDate);
      flightDate.setHours(0, 0, 0, 0);
      
      // Check if flight date is before today
      if (flightDate < today) {
        newErrors.flightDate = 'Flight date cannot be in the past';
      }
    }

    // Validate flight time if booking is confirmed
    if (formData.isBooked && !formData.flightTime) {
      newErrors.flightTime = 'Flight Time is required when booking is confirmed';
    } else if (formData.flightTime && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(formData.flightTime)) {
      newErrors.flightTime = 'Please enter time in HH:mm format';
    }
    
    // Validate flight details length
    if (formData.flightDetails && formData.flightDetails.length > 250) {
      newErrors.flightDetails = 'Flight Details must be 250 characters or less';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Remove formatTimeForDisplay and use a function to ensure HH:mm:ss
  const to24HourWithSeconds = (time: string) => {
    // If already in HH:mm:ss
    if (/^\d{2}:\d{2}:\d{2}$/.test(time)) return time;
    // If in HH:mm
    if (/^\d{2}:\d{2}$/.test(time)) return time + ':00';
    return '';
  };

  // Handle form submission
  const handleSubmit = () => {
    if (validateForm()) {
      const formattedData = {
        ...formData,
        flightDate: formData.flightDate,
        flightTime: to24HourWithSeconds(formData.flightTime) // Ensure proper format for submission
      };
      onSubmit(formattedData);
      onClose(); // Close the modal on successful submission
    }
  };

  // Reset form when modal is closed
  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  // Memoize options for Autocomplete to prevent unnecessary re-renders
  const airportOptions = React.useMemo(() => {
    return airportData.map(airport => ({
      label: `${airport.city} (${airport.IATA}) - ${airport.airportName || ''}`.trim(),
      IATA: airport.IATA,
    }));
  }, [airportData]);

  return (
    <Dialog open={open} onClose={onClose} PaperProps={{ sx: { borderRadius: '12px' } }} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1A9698', color: 'white' }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
          Add New Trip
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            color: 'white',
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 4, bgcolor: '#f5f8fa' }}>
        <Box component="form" noValidate autoComplete="off" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Autocomplete
            options={airportOptions}
            getOptionLabel={(option) => option.label}
            onChange={handleCityAutocompleteChange('fromCity')}
            value={airportOptions.find(option => option.IATA === formData.fromCity) || null}
            isOptionEqualToValue={(option, value) => option.IATA === value.IATA}
            renderInput={(params) => (
              <TextField
                {...params}
                label="From City (IATA Code)"
                name="fromCity"
                required
                error={!!errors.fromCity}
                helperText={errors.fromCity}
                InputProps={{
                  ...params.InputProps,
                  // No maxLength here, as users type city names
                }}
                // No onChange={handleChange} here, Autocomplete manages input
              />
            )}
          />

          <Autocomplete
            options={airportOptions}
            getOptionLabel={(option) => option.label}
            onChange={handleCityAutocompleteChange('toCity')}
            value={airportOptions.find(option => option.IATA === formData.toCity) || null}
            isOptionEqualToValue={(option, value) => option.IATA === value.IATA}
            renderInput={(params) => (
              <TextField
                {...params}
                label="To City (IATA Code)"
                name="toCity"
                required
                error={!!errors.toCity}
                helperText={errors.toCity}
                InputProps={{
                  ...params.InputProps,
                  // No maxLength here
                }}
                // No onChange={handleChange} here
              />
            )}
          />

          <TextField
            label="Layover City (Optional, IATA Code)"
            name="layoverCity"
            value={formData.layoverCity}
            onChange={handleChange}
            error={!!errors.layoverCity}
            helperText={errors.layoverCity}
            inputProps={{ maxLength: 3 }}
          />

          <TextField
            label="Flight Date"
            name="flightDate"
            type="date"
            value={formData.flightDate}
            onChange={handleChange}
            required
            error={!!errors.flightDate}
            helperText={errors.flightDate}
            InputLabelProps={{
              shrink: true,
            }}
          />

          <TextField
            label="Flight Time (HH:mm)"
            name="flightTime"
            type="time"
            value={formData.flightTime}
            onChange={handleChange}
            required={formData.isBooked} // Required only if booked
            error={!!errors.flightTime}
            helperText={errors.flightTime}
            InputLabelProps={{
              shrink: true,
            }}
          />

          <FormControlLabel
            control={
              <Checkbox
                checked={formData.isBooked}
                onChange={handleCheckboxChange}
                name="isBooked"
                color="primary"
              />
            }
            label="Flight Confirmed/Booked"
          />

          <TextareaAutosize
            aria-label="Flight Details"
            minRows={3}
            placeholder="Flight Details (optional, max 250 characters)"
            name="flightDetails"
            value={formData.flightDetails}
            onChange={handleChange}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '4px',
              border: errors.flightDetails ? '1px solid red' : '1px solid #ccc',
              fontSize: '1rem',
              fontFamily: 'Roboto, Helvetica, Arial, sans-serif',
              resize: 'vertical',
              backgroundColor: '#ffffff',
            }}
          />
          {errors.flightDetails && (
            <Typography variant="caption" color="error">
              {errors.flightDetails}
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 3, borderTop: '1px solid #e0e0e0', bgcolor: '#ffffff' }}>
        <Button onClick={onClose} sx={{ color: '#2c3e50', '&:hover': { bgcolor: '#e0e0e0' } }}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          sx={{ bgcolor: '#1A9698', '&:hover': { bgcolor: '#167a7c' } }}
        >
          Add Trip
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddTripModal; 