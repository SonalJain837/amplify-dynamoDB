import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Checkbox,
  FormControlLabel,
  Typography,
  IconButton,
  Box,
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
}

interface AddTripModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  airportData?: Schema["Airports"]["type"][];
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

  // Handle form field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === 'layoverCity') {
      const formattedValue = value.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 3);
      setFormData({ ...formData, [name]: formattedValue });
    } else if (name === 'flightDetails') {
      if (value.length <= 250) {
        setFormData({ ...formData, [name]: value });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Handle Autocomplete changes
  const handleAutocompleteChange = (field: keyof TripFormData, value: Schema["Airports"]["type"] | null) => {
    setFormData({ ...formData, [field]: value ? value.IATA : '' });
  };

  // Handle checkbox change
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      isBooked: e.target.checked
    });
  };

  // Validate the form
  const validateForm = (): boolean => {
    const newErrors: TripFormErrors = {};
    
    // Validate From City
    if (!formData.fromCity) {
      newErrors.fromCity = 'From City is required';
    }
    
    // Validate To City
    if (!formData.toCity) {
      newErrors.toCity = 'To City is required';
    }
    
    // Validate Layover City if provided
    if (formData.layoverCity && formData.layoverCity.length !== 3) {
      newErrors.layoverCity = 'City code must be 3 characters';
    }
    
    // Validate Flight Date (now mandatory)
    if (!formData.flightDate) {
      newErrors.flightDate = 'Flight Date is required';
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const flightDate = new Date(formData.flightDate);
      flightDate.setHours(0, 0, 0, 0);
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

  // Handle form submission
  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData);
      onClose(); // Close the modal on successful submission
    }
  };

  useEffect(() => {
    if (!open) {
      // resetForm();
    }
  }, [open]);

  const airportOptions = airportData?.map(airport => ({
    ...airport,
    label: `${airport.city} - ${airport.IATA}`
  })) || [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Add a Trip</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box component="form" noValidate autoComplete="off">
          <Autocomplete
            options={airportOptions}
            getOptionLabel={(option) => option.label || ''}
            onChange={(event, value) => handleAutocompleteChange('fromCity', value)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="From City"
                margin="normal"
                error={!!errors.fromCity}
                helperText={errors.fromCity}
              />
            )}
          />
          <Autocomplete
            options={airportOptions}
            getOptionLabel={(option) => option.label || ''}
            onChange={(event, value) => handleAutocompleteChange('toCity', value)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="To City"
                margin="normal"
                error={!!errors.toCity}
                helperText={errors.toCity}
              />
            )}
          />
          <TextField
            label="Layover City (optional)"
            name="layoverCity"
            value={formData.layoverCity}
            onChange={handleChange}
            error={!!errors.layoverCity}
            helperText={errors.layoverCity}
            fullWidth
            margin="normal"
            inputProps={{
              maxLength: 3,
              style: { textTransform: 'uppercase' }
            }}
          />
          <TextField
            label="Flight Date"
            name="flightDate"
            type="date"
            value={formData.flightDate}
            onChange={handleChange}
            error={!!errors.flightDate}
            helperText={errors.flightDate}
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Flight Time (optional, HH:mm)"
            name="flightTime"
            type="time"
            value={formData.flightTime}
            onChange={handleChange}
            error={!!errors.flightTime}
            helperText={errors.flightTime}
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Flight Details (optional)"
            name="flightDetails"
            value={formData.flightDetails}
            onChange={handleChange}
            error={!!errors.flightDetails}
            helperText={errors.flightDetails}
            fullWidth
            multiline
            rows={2}
            margin="normal"
            inputProps={{
              maxLength: 250
            }}
          />
          <FormControlLabel
            control={<Checkbox checked={formData.isBooked} onChange={handleCheckboxChange} name="isBooked" />}
            label="Booking Confirmed"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button onClick={handleSubmit} color="primary" variant="contained">
          Add Trip
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddTripModal; 