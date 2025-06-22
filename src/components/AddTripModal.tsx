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

    if (name === 'fromCity' || name === 'toCity' || name === 'layoverCity') {
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

  // Reset form when modal is closed
  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} PaperProps={{ sx: { borderRadius: '8px' } }} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
          Create a Travel Record
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 3 }}>
        <Box component="form" noValidate autoComplete="off" sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <TextField
            name="fromCity"
            label="From City* (3-letter code)"
            value={formData.fromCity}
            onChange={handleChange}
            error={!!errors.fromCity}
            helperText={errors.fromCity}
            fullWidth
          />
          <TextField
            name="toCity"
            label="To City* (3-letter code)"
            value={formData.toCity}
            onChange={handleChange}
            error={!!errors.toCity}
            helperText={errors.toCity}
            fullWidth
          />
          <TextField
            name="layoverCity"
            label="Layover City (optional, 3-letter code)"
            value={formData.layoverCity}
            onChange={handleChange}
            error={!!errors.layoverCity}
            helperText={errors.layoverCity}
            fullWidth
          />
          <FormControlLabel
            control={<Checkbox checked={formData.isBooked} onChange={handleCheckboxChange} name="isBooked" />}
            label="Booking Confirmed?"
          />
          <TextField
            name="flightDate"
            label="Flight Date* (DD-MON-YYYY)"
            type="date"
            value={formData.flightDate}
            onChange={handleChange}
            error={!!errors.flightDate}
            helperText={errors.flightDate}
            InputLabelProps={{
              shrink: true,
            }}
            fullWidth
          />
          <TextField
            name="flightTime"
            label={formData.isBooked ? "Flight Time*" : "Flight Time"}
            type="time"
            value={formData.flightTime}
            onChange={handleChange}
            error={!!errors.flightTime}
            helperText={errors.flightTime}
            InputLabelProps={{
              shrink: true,
            }}
            fullWidth
          />
          <TextareaAutosize
            aria-label="Flight Details"
            minRows={3}
            placeholder="Flight Details (max 250 chars)"
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
              resize: 'vertical'
            }}
          />
           {errors.flightDetails && (
            <Typography variant="caption" color="error">
              {errors.flightDetails}
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleSubmit} variant="contained" sx={{ bgcolor: '#1A9698', '&:hover': { bgcolor: '#147d7e' } }}>
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddTripModal; 