import React, { useState, useEffect, useRef, memo, useMemo, useCallback } from 'react';
import {
  Dialog,
  Button,
  TextField,
  Checkbox,
  FormControlLabel,
  Typography,
  IconButton,
  Box,
  GlobalStyles,
  Chip,
  Alert,
  Fade,
  Slide,
  CircularProgress,
  LinearProgress,
  Paper
} from '@mui/material';
import {
  Close as CloseIcon,
  FlightTakeoff as FlightTakeoffIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { type Schema } from '../../amplify/data/resource';
import { styled } from '@mui/material/styles';
import { CustomDateInput } from './CustomDateInput';
import { dateFormatter } from '../utils/dateFormatter';
import VirtualizedCityDropdown from './VirtualizedCityDropdown';
import { usePerformanceMonitor } from '../hooks/usePerformanceMonitor';
import { useDebouncedSearch } from '../hooks/useDebounce';

const LANGUAGE_OPTIONS = [
  'English', 'Hindi', 'Assamese', 'Bengali', 'Gujarati', 'Kannada', 
  'Kashmiri', 'Konkani', 'Malayalam', 'Marathi', 'Mandarin (Chinese)', 
  'Nepali', 'Odia', 'Punjabi', 'Sindhi', 'Tamil', 'Telugu', 'Urdu', 'Other'
];

const FLIGHT_DETAILS_SUGGESTIONS = [
  {
    id: 'companion-needed',
    text: 'Need Companion',
    message: 'Need companion for my parents'
  },
  {
    id: 'flight-number',
    text: 'Flight Number',
    message: 'They are traveling on Flight Number '
  },
  {
    id: 'flights-not-booked',
    text: 'Not Booked',
    message: 'Flights are not booked'
  }
];


interface TripFormData {
  fromCity: string;
  toCity: string;
  layoverCities: string[];
  flightDate: string;
  flightTime: string;
  isBooked: boolean;
  flightDetails: string;
  languagePreferences: string[];
}

interface TripFormErrors {
  fromCity?: string;
  toCity?: string;
  layoverCities?: string;
  flightDate?: string;
  flightTime?: string;
  flightDetails?: string;
  languagePreferences?: string;
}

interface AddTripModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  airportData: Schema["Airports"]["type"][];
  isLoading?: boolean;
}

// Styled components for better performance and visual hierarchy
const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: theme.spacing(2),
    maxWidth: '600px',
    width: '100%',
    margin: theme.spacing(2),
    [theme.breakpoints.down('sm')]: {
      margin: theme.spacing(1),
      borderRadius: theme.spacing(1),
      maxHeight: '95vh'
    }
  }
}));

const HeaderSection = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
  color: 'white',
  padding: theme.spacing(3),
  borderRadius: `${theme.spacing(2)} ${theme.spacing(2)} 0 0`,
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(255,255,255,0.1)',
    borderRadius: 'inherit'
  }
}));

const FormSection = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2.5),
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2)
  }
}));

const ActionSection = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2, 3),
  borderTop: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  gap: theme.spacing(1),
  justifyContent: 'flex-end',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
    flexDirection: 'column-reverse'
  }
}));

const AddTripModal: React.FC<AddTripModalProps> = memo(({ 
  open, 
  onClose, 
  onSubmit, 
  airportData = [], 
  isLoading = false 
}) => {
  // Performance monitoring
  usePerformanceMonitor('AddTripModal', [open, airportData]);
  // Optimized form state with better structure
  const [formData, setFormData] = useState<TripFormData>({
    fromCity: '',
    toCity: '',
    layoverCities: [],
    flightDate: '',
    flightTime: '',
    isBooked: false,
    flightDetails: '',
    languagePreferences: ['English']
  });
  
  const [errors, setErrors] = useState<TripFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Active suggestion state for visual feedback
  const [activeSuggestionId, setActiveSuggestionId] = useState<string | null>(null);
  
  // Language dropdown state (simplified)
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);
  const [languageSearchTerm, setLanguageSearchTerm] = useState('');
  const languageInputRef = useRef<HTMLDivElement>(null);
  const languageDropdownRef = useRef<HTMLDivElement>(null);
  
  // Debounced language search
  const { debouncedSearchTerm: debouncedLanguageSearch } = useDebouncedSearch(languageSearchTerm, 300);

  // Memoized language filtering for performance
  const filteredLanguages = useMemo(() => {
    if (!debouncedLanguageSearch.trim()) return LANGUAGE_OPTIONS;
    return LANGUAGE_OPTIONS.filter(language =>
      language.toLowerCase().includes(debouncedLanguageSearch.toLowerCase())
    );
  }, [debouncedLanguageSearch]);

  // Optimized form field handler
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    setFormData(prev => {
      if (name === 'flightDetails') {
        return value.length <= 250 ? { ...prev, [name]: value } : prev;
      }
      return { ...prev, [name]: value };
    });
    
    // Clear active suggestion if flight details are manually modified
    if (name === 'flightDetails' && activeSuggestionId) {
      const matchingSuggestion = FLIGHT_DETAILS_SUGGESTIONS.find(
        suggestion => suggestion.message.trim() === value.trim()
      );
      
      if (!matchingSuggestion) {
        setActiveSuggestionId(null);
      } else if (matchingSuggestion.id !== activeSuggestionId) {
        setActiveSuggestionId(matchingSuggestion.id);
      }
    }
    
    // Clear error when user starts typing
    if (errors[name as keyof TripFormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  }, [errors, activeSuggestionId]);


  // Optimized city selection handlers
  const handleFromCityChange = useCallback((value: string | string[]) => {
    const cityValue = Array.isArray(value) ? value[0] : value;
    setFormData(prev => ({ ...prev, fromCity: cityValue }));
    if (errors.fromCity) {
      setErrors(prev => ({ ...prev, fromCity: undefined }));
    }
  }, [errors.fromCity]);
  
  const handleToCityChange = useCallback((value: string | string[]) => {
    const cityValue = Array.isArray(value) ? value[0] : value;
    setFormData(prev => ({ ...prev, toCity: cityValue }));
    if (errors.toCity) {
      setErrors(prev => ({ ...prev, toCity: undefined }));
    }
  }, [errors.toCity]);
  
  const handleLayoverCitiesChange = useCallback((value: string | string[]) => {
    const citiesValue = Array.isArray(value) ? value : [value].filter(Boolean);
    setFormData(prev => ({ ...prev, layoverCities: citiesValue }));
    if (errors.layoverCities) {
      setErrors(prev => ({ ...prev, layoverCities: undefined }));
    }
  }, [errors.layoverCities]);

  // Optimized checkbox handler
  const handleCheckboxChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, isBooked: e.target.checked }));
  }, []);

  // Optimized language preference handlers
  const handleLanguageToggle = useCallback((language: string) => {
    setFormData(prev => {
      const updatedLanguages = prev.languagePreferences.includes(language)
        ? prev.languagePreferences.filter(lang => lang !== language)
        : [...prev.languagePreferences, language];
      return { ...prev, languagePreferences: updatedLanguages };
    });
    
    // Close dropdown after selection (optional - you might want to keep it open for multiple selections)
    // setLanguageDropdownOpen(false);
    // setLanguageSearchTerm('');
  }, []);

  const handleLanguageChipDelete = useCallback((languageToDelete: string) => {
    setFormData(prev => ({
      ...prev,
      languagePreferences: prev.languagePreferences.filter(lang => lang !== languageToDelete)
    }));
  }, []);

  const clearAllLanguages = useCallback(() => {
    setFormData(prev => ({ ...prev, languagePreferences: [] }));
  }, []);

  // Flight details suggestion handler with focus and cursor management
  const handleFlightDetailsSuggestion = useCallback((suggestion: typeof FLIGHT_DETAILS_SUGGESTIONS[0]) => {
    // Update form data
    setFormData(prev => ({ ...prev, flightDetails: suggestion.message }));
    
    // Set active suggestion for visual feedback
    setActiveSuggestionId(suggestion.id);
    
    // Clear any existing errors
    if (errors.flightDetails) {
      setErrors(prev => ({ ...prev, flightDetails: undefined }));
    }

    // Focus the textarea and position cursor at end for immediate editing
    setTimeout(() => {
      const textarea = document.querySelector('[name="flightDetails"]') as HTMLTextAreaElement;
      if (textarea) {
        textarea.focus();
        const length = suggestion.message.length;
        textarea.setSelectionRange(length, length);
      }
    }, 0);
  }, [errors.flightDetails]);


  // This is now handled by the memoized filteredLanguages above

  // These handlers are now integrated into the VirtualizedCityDropdown component

  // Enhanced form validation with better error handling
  const validateForm = useCallback((): boolean => {
    const newErrors: TripFormErrors = {};
    
    try {
      // Validate From City
      if (!formData.fromCity?.trim()) {
        newErrors.fromCity = 'Departure city is required';
      }
      
      // Validate To City
      if (!formData.toCity?.trim()) {
        newErrors.toCity = 'Destination city is required';
      }
      
      // Check if From City and To City are the same
      if (formData.fromCity && formData.toCity && formData.fromCity === formData.toCity) {
        newErrors.fromCity = 'Departure and destination cannot be the same';
        newErrors.toCity = 'Departure and destination cannot be the same';
      }
      
      // Validate layover cities don't include from/to cities
      if (formData.layoverCities.length > 0) {
        if (formData.layoverCities.includes(formData.fromCity)) {
          newErrors.layoverCities = 'Layover cities cannot include departure city';
        }
        if (formData.layoverCities.includes(formData.toCity)) {
          newErrors.layoverCities = 'Layover cities cannot include destination city';
        }
        if (formData.layoverCities.length > 3) {
          newErrors.layoverCities = 'Maximum 3 layover cities allowed';
        }
      }
      
      // Validate Flight Date
      if (!formData.flightDate?.trim()) {
        newErrors.flightDate = 'Flight date is required';
      } else {
        const validationError = dateFormatter.getValidationError(formData.flightDate);
        if (validationError) {
          newErrors.flightDate = validationError;
        }
      }

      // Validate flight time if booking is confirmed
      if (formData.isBooked && !formData.flightTime?.trim()) {
        newErrors.flightTime = 'Flight time is required when booking is confirmed';
      } else if (formData.flightTime && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(formData.flightTime)) {
        newErrors.flightTime = 'Please enter time in HH:mm format';
      }
      
      // Validate flight details length
      if (formData.flightDetails && formData.flightDetails.length > 250) {
        newErrors.flightDetails = 'Flight details must be 250 characters or less';
      }
      
      // Validate language preferences
      if (formData.languagePreferences.length === 0) {
        newErrors.languagePreferences = 'At least one language preference is required';
      }
      
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    } catch (error) {
      console.error('Validation error:', error);
      setSubmitError('An error occurred during validation. Please try again.');
      return false;
    }
  }, [formData]);

  // Optimized form reset with cleanup
  const resetForm = useCallback(() => {
    setFormData({
      fromCity: '',
      toCity: '',
      layoverCities: [],
      flightDate: '',
      flightTime: '',
      isBooked: false,
      flightDetails: '',
      languagePreferences: ['English']
    });
    setErrors({});
    setSubmitError(null);
    setLanguageSearchTerm('');
    setLanguageDropdownOpen(false);
    setActiveSuggestionId(null); // Reset active suggestion state
  }, []);

  // Enhanced form submission with error handling
  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return; // Prevent double submission
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      if (validateForm()) {
        await onSubmit(formData);
        resetForm();
        onClose();
      }
    } catch (error) {
      console.error('Submission error:', error);
      setSubmitError('Failed to submit trip. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, isSubmitting, onSubmit, onClose, resetForm, validateForm]);

  // Outside click detection and keyboard support for language dropdown
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (languageDropdownOpen) {
        const target = event.target as Node;
        
        // Check if click is outside both the input field and dropdown
        if (
          languageInputRef.current && 
          languageDropdownRef.current &&
          !languageInputRef.current.contains(target) &&
          !languageDropdownRef.current.contains(target)
        ) {
          setLanguageDropdownOpen(false);
          setLanguageSearchTerm(''); // Clear search term when closing
        }
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (languageDropdownOpen && event.key === 'Escape') {
        setLanguageDropdownOpen(false);
        setLanguageSearchTerm(''); // Clear search term when closing
        // Return focus to the input field
        if (languageInputRef.current) {
          languageInputRef.current.focus();
        }
      }
    };

    // Add event listeners only when dropdown is open
    if (languageDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }

    // Cleanup function
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [languageDropdownOpen]);

  // Cleanup when modal closes
  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open, resetForm]);
  
  // Check for matching suggestion when flightDetails changes
  useEffect(() => {
    if (formData.flightDetails && !activeSuggestionId) {
      const matchingSuggestion = FLIGHT_DETAILS_SUGGESTIONS.find(
        suggestion => suggestion.message.trim() === formData.flightDetails.trim()
      );
      
      if (matchingSuggestion) {
        setActiveSuggestionId(matchingSuggestion.id);
      }
    }
  }, [formData.flightDetails, activeSuggestionId]);
  
  // Prevent memory leaks from async operations
  useEffect(() => {
    return () => {
      setIsSubmitting(false);
      setSubmitError(null);
    };
  }, []);

  // Memoized airport data processing for performance
  const memoizedAirportData = useMemo(() => (airportData as any[]) || [], [airportData]);
  
  // Check if airport data is loaded and ready
  const isAirportDataReady = memoizedAirportData.length > 0;

  // Styled components for optimized language dropdown
  const LanguageDropdownContainer = styled(Box)(({ theme }) => ({
    position: 'relative',
    width: '100%',
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(1),
  }));

  const LanguageInputField = styled(Box)(({ theme }) => ({
    minHeight: '56px',
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(1, 1.5),
    cursor: 'pointer',
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    position: 'relative',
    backgroundColor: 'white',
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      borderColor: theme.palette.primary.main,
      backgroundColor: theme.palette.action.hover,
    },
    '&:focus-within': {
      borderColor: theme.palette.primary.main,
      borderWidth: '2px',
      padding: theme.spacing(1, 1.375),
      boxShadow: `0 0 0 1px ${theme.palette.primary.main}20`,
    },
    [theme.breakpoints.down('sm')]: {
      minHeight: '48px',
      padding: theme.spacing(0.75, 1),
      gap: theme.spacing(0.25),
    },
  }));

  const LanguageDropdown = styled(Paper)(({ theme }) => ({
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    maxHeight: '200px',
    overflowY: 'auto',
    zIndex: 1300,
    marginTop: theme.spacing(0.5),
    boxShadow: theme.shadows[8],
    border: `1px solid ${theme.palette.divider}`,
    [theme.breakpoints.down('sm')]: {
      maxHeight: '150px',
      left: theme.spacing(-1),
      right: theme.spacing(-1),
    },
  }));

  const SearchInput = styled(TextField)(({ theme }) => ({
    '& .MuiOutlinedInput-root': {
      '& fieldset': {
        border: 'none',
      },
    },
    '& .MuiInputBase-input': {
      padding: theme.spacing(1, 1.5),
      fontSize: '14px',
    },
  }));
  
  // Performance optimization: Early return if modal is not open
  if (!open) return null;
  
  // Handle keyboard navigation  
  // const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
  //   if (event.key === 'Escape') {
  //     onClose();
  //   }
  // }, [onClose]);

  return (
    <>
      <GlobalStyles
        styles={{
          '.MuiAutocomplete-option': {
            color: '#222 !important',
            backgroundColor: 'white !important',
          },
          '.MuiAutocomplete-option[aria-selected="true"], .MuiAutocomplete-option.Mui-focused, .MuiAutocomplete-option:hover': {
            backgroundColor: '#e3f2fd !important',
            color: '#222 !important',
          },
          // Global text selection styling for the modal
          '.MuiDialog-paper ::selection': {
            backgroundColor: '#14B8A6 !important',
            color: '#ffffff !important',
          },
          '.MuiDialog-paper ::-moz-selection': {
            backgroundColor: '#14B8A6 !important',
            color: '#ffffff !important',
          },
          // Specifically target form inputs
          '.MuiDialog-paper .MuiInputBase-input::selection': {
            backgroundColor: '#14B8A6 !important',
            color: '#ffffff !important',
          },
          '.MuiDialog-paper .MuiInputBase-input::-moz-selection': {
            backgroundColor: '#14B8A6 !important',
            color: '#ffffff !important',
          },
        }}
      />
      <StyledDialog 
        open={open} 
        onClose={onClose} 
        maxWidth="sm" 
        fullWidth
        TransitionComponent={Slide}
        TransitionProps={{ direction: 'up' } as any}
      >
        {/* Enhanced Header with Progress Indicator */}
        <HeaderSection>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box sx={{ zIndex: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
                Add Your Trip
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Share your travel plans with the community
              </Typography>
            </Box>
            <IconButton 
              onClick={onClose} 
              sx={{ 
                color: 'white', 
                zIndex: 1,
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
          {isSubmitting && (
            <LinearProgress 
              sx={{ 
                position: 'absolute', 
                bottom: 0, 
                left: 0, 
                right: 0,
                backgroundColor: 'rgba(255,255,255,0.2)',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: 'white'
                }
              }} 
            />
          )}
        </HeaderSection>
        <FormSection>
          {/* Error Alert */}
          {submitError && (
            <Fade in={!!submitError}>
              <Alert 
                severity="error" 
                onClose={() => setSubmitError(null)}
                sx={{ mb: 2 }}
              >
                {submitError}
              </Alert>
            </Fade>
          )}
          
          {/* Loading State for Airport Data */}
          {!isAirportDataReady && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} />
                Loading airport data...
              </Box>
            </Alert>
          )}
          
          <Box component="form" noValidate autoComplete="off" display="flex" flexDirection="column" gap={2.5}>
            {/* Optimized From City Dropdown */}
            <VirtualizedCityDropdown
              label="From City"
              placeholder="Select departure city..."
              value={formData.fromCity}
              onChange={handleFromCityChange}
              options={memoizedAirportData}
              isLoading={!isAirportDataReady}
              error={errors.fromCity}
              dropdownType="from"
              disabled={isSubmitting}
              required
            />
            {/* Optimized To City Dropdown */}
            <VirtualizedCityDropdown
              label="To City"
              placeholder="Select destination city..."
              value={formData.toCity}
              onChange={handleToCityChange}
              options={memoizedAirportData}
              isLoading={!isAirportDataReady}
              error={errors.toCity}
              dropdownType="to"
              disabled={isSubmitting}
              required
            />
            {/* Optimized Layover Cities Multi-Select Dropdown */}
            <VirtualizedCityDropdown
              label="Layover Cities (optional - max 3)"
              placeholder="Add layover cities..."
              value={formData.layoverCities}
              onChange={handleLayoverCitiesChange}
              options={memoizedAirportData}
              isLoading={!isAirportDataReady}
              error={errors.layoverCities}
              multiSelect
              maxSelections={3}
              dropdownType="layover"
              disabled={isSubmitting}
            />
            {/* Enhanced Booking Status */}
            <Box sx={{ 
              border: '1px solid', 
              borderColor: 'divider', 
              borderRadius: 1, 
              p: 2, 
              bgcolor: 'grey.50' 
            }}>
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={formData.isBooked} 
                    onChange={handleCheckboxChange} 
                    name="isBooked"
                    disabled={isSubmitting}
                    sx={{ 
                      color: 'primary.main',
                      '&.Mui-checked': { 
                        color: 'success.main' 
                      }
                    }}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Booking Confirmed?
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formData.isBooked ? 'Flight time will be required' : 'Flight time is optional'}
                    </Typography>
                  </Box>
                }
              />
            </Box>
            {/* Enhanced Date Input */}
            <CustomDateInput
              label="Flight Date*"
              value={formData.flightDate}
              onChange={(value) => {
                setFormData(prev => ({ ...prev, flightDate: value }));
                if (errors.flightDate) {
                  setErrors(prev => ({ ...prev, flightDate: undefined }));
                }
              }}
              error={!!errors.flightDate}
              helperText={errors.flightDate}
              fullWidth
              margin="normal"
              disabled={isSubmitting}
            />
            {/* Enhanced Time Input */}
            <TextField
              label={formData.isBooked ? 'Flight Time*' : 'Flight Time'}
              name="flightTime"
              type="time"
              value={formData.flightTime}
              onChange={handleChange}
              error={!!errors.flightTime}
              helperText={errors.flightTime || (formData.isBooked ? 'Required when booking is confirmed' : 'Optional')}
              fullWidth
              margin="normal"
              disabled={isSubmitting}
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiInputBase-input': {
                  fontSize: '16px' // Prevents zoom on mobile
                }
              }}
            />

            {/* Enhanced Language Preference Dropdown */}
            <LanguageDropdownContainer>
              <Typography
                variant="caption"
                sx={{
                  position: 'absolute',
                  top: -8,
                  left: 12,
                  backgroundColor: 'white',
                  px: 0.5,
                  fontSize: 12,
                  fontWeight: 500,
                  color: errors.languagePreferences ? 'error.main' : 'text.secondary',
                  zIndex: 1
                }}
              >
                Language Preferences{' '}
                <Box component="span" sx={{ color: 'error.main' }}>*</Box>
              </Typography>
              
              <LanguageInputField
                ref={languageInputRef}
                onClick={() => !isSubmitting && setLanguageDropdownOpen(!languageDropdownOpen)}
                tabIndex={0}
                role="combobox"
                aria-expanded={languageDropdownOpen}
                aria-haspopup="listbox"
                aria-label="Language Preferences"
                sx={{
                  borderColor: errors.languagePreferences ? 'error.main' : 'divider',
                  opacity: isSubmitting ? 0.6 : 1,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer'
                }}
              >
                {formData.languagePreferences.length === 0 ? (
                  <Typography variant="body2" sx={{ color: 'text.secondary', flexGrow: 1 }}>
                    Select languages...
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, flexGrow: 1 }}>
                    {formData.languagePreferences.map((language) => (
                      <Chip
                        key={language}
                        label={language}
                        onDelete={() => !isSubmitting && handleLanguageChipDelete(language)}
                        size="small"
                        sx={{
                          backgroundColor: '#E8F5E8',
                          '& .MuiChip-deleteIcon': { fontSize: 16 }
                        }}
                      />
                    ))}
                  </Box>
                )}
                
                {isSubmitting ? (
                  <CircularProgress size={20} />
                ) : (
                  <Box 
                    sx={{ 
                      transform: languageDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease-in-out'
                    }}
                  >
                    ⌄
                  </Box>
                )}
              </LanguageInputField>

              {languageDropdownOpen && !isSubmitting && (
                <LanguageDropdown ref={languageDropdownRef}>
                  <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <SearchInput
                      placeholder="Search languages..."
                      variant="outlined"
                      size="small"
                      fullWidth
                      value={languageSearchTerm}
                      onChange={(e) => setLanguageSearchTerm(e.target.value)}
                      autoFocus
                    />
                  </Box>
                  
                  {formData.languagePreferences.length > 0 && (
                    <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                      <Button
                        size="small"
                        color="error"
                        onClick={clearAllLanguages}
                        startIcon={<CloseIcon sx={{ fontSize: 16 }} />}
                        fullWidth
                      >
                        Clear All
                      </Button>
                    </Box>
                  )}

                  <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
                    {filteredLanguages.map((language) => {
                      const isSelected = formData.languagePreferences.includes(language);
                      return (
                        <Box
                          key={language}
                          onClick={() => handleLanguageToggle(language)}
                          sx={{
                            p: 1.5,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            '&:hover': {
                              backgroundColor: 'action.hover'
                            },
                            backgroundColor: isSelected ? 'primary.50' : 'transparent'
                          }}
                        >
                          {isSelected && (
                            <CheckCircleIcon sx={{ fontSize: 18, color: 'success.main' }} />
                          )}
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: isSelected ? 600 : 400,
                              color: isSelected ? 'primary.main' : 'inherit'
                            }}
                          >
                            {language}
                          </Typography>
                        </Box>
                      );
                    })}
                    {filteredLanguages.length === 0 && (
                      <Box sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                          No languages found
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </LanguageDropdown>
              )}
              
              {errors.languagePreferences && (
                <Typography variant="caption" sx={{ color: 'error.main', mt: 0.5, ml: 1.5, fontSize: 12 }}>
                  {errors.languagePreferences}
                </Typography>
              )}
            </LanguageDropdownContainer>
            {/* Enhanced Flight Details with Quick Suggestions */}
            <Box sx={{ width: '100%' }}>
              <TextField
                label="Flight Details (optional)"
                name="flightDetails"
                value={formData.flightDetails}
                onChange={handleChange}
                error={!!errors.flightDetails}
                helperText={
                  errors.flightDetails ||
                  `${formData.flightDetails.length}/250 characters`
                }
                fullWidth
                multiline
                rows={4}
                margin="normal"
                disabled={isSubmitting}
                placeholder="Any specific requests or details..."
                inputProps={{
                  maxLength: 250
                }}
                sx={{
                  '& .MuiInputBase-input': {
                    fontSize: '16px' // Prevents zoom on mobile
                  }
                }}
              />
              
              {/* Flight Details Quick Suggestions */}
              <Box sx={{ 
                mt: 1.5, 
                mb: 1
              }}>
                <Box sx={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: 1,
                  '@media (max-width: 640px)': {
                    flexDirection: 'column'
                  }
                }}>
                  {FLIGHT_DETAILS_SUGGESTIONS.map((suggestion) => {
                    const isActive = activeSuggestionId === suggestion.id;
                    return (
                      <Chip
                        key={suggestion.id}
                        label={suggestion.text}
                        onClick={() => !isSubmitting && handleFlightDetailsSuggestion(suggestion)}
                        variant="outlined"
                        size="small"
                        disabled={isSubmitting}
                        sx={{
                          padding: '6px 12px',
                          border: isActive ? '1px solid #0f766e' : '1px solid #d1d5db',
                          borderRadius: '6px',
                          backgroundColor: isActive ? '#0f766e' : '#ffffff',
                          color: isActive ? '#ffffff' : '#374151',
                          fontSize: '0.8125rem',
                          height: 'auto',
                          cursor: isSubmitting ? 'not-allowed' : 'pointer',
                          transition: 'all 0.2s ease',
                          whiteSpace: 'nowrap',
                          fontWeight: isActive ? 600 : 500,
                          boxShadow: isActive ? '0 2px 8px rgba(15, 118, 110, 0.25)' : 'none',
                          '&:hover': isActive ? {
                            backgroundColor: '#115e59',
                            borderColor: '#115e59',
                            transform: 'none',
                            boxShadow: '0 2px 8px rgba(17, 94, 89, 0.3)',
                          } : {
                            borderColor: '#3b82f6',
                            backgroundColor: '#eff6ff',
                            color: '#1d4ed8',
                            transform: 'translateY(-1px)',
                            boxShadow: '0 2px 4px rgba(59, 130, 246, 0.1)',
                          },
                          '&:active': {
                            transform: isActive ? 'none' : 'translateY(1px)',
                            transition: 'transform 0.1s ease',
                          },
                          '&:focus': {
                            outline: isActive ? '2px solid #ffffff' : '2px solid #3b82f6',
                            outlineOffset: '2px',
                          },
                          '&.MuiChip-outlined': {
                            border: isActive ? '1px solid #0f766e' : '1px solid #d1d5db',
                          },
                          '& .MuiChip-label': {
                            padding: 0,
                            fontSize: '0.8125rem',
                          },
                          '@media (max-width: 640px)': {
                            width: '100%',
                            justifyContent: 'flex-start',
                            '& .MuiChip-label': {
                              textAlign: 'left'
                            }
                          }
                        }}
                        aria-label={isActive ? `Selected: ${suggestion.text} preference` : `Insert flight preference: ${suggestion.text}`}
                        aria-pressed={isActive}
                        role="button"
                        tabIndex={0}
                      />
                    );
                  })}
                </Box>
              </Box>
            </Box>
          </Box>
        </FormSection>
        
        {/* Enhanced Action Section */}
        <ActionSection>
          <Button 
            onClick={onClose} 
            color="inherit"
            disabled={isSubmitting}
            sx={(theme) => ({ 
              minWidth: 100,
              [theme.breakpoints.down('sm')]: {
                order: 2
              }
            })}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={isSubmitting || !isAirportDataReady}
            startIcon={
              isSubmitting ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <FlightTakeoffIcon />
              )
            }
            sx={(theme) => ({
              minWidth: 140,
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #1976D2 30%, #1CB5E0 90%)',
              },
              '&:disabled': {
                background: 'rgba(0, 0, 0, 0.12)'
              },
              [theme.breakpoints.down('sm')]: {
                order: 1
              }
            })}
          >
            {isSubmitting ? 'Adding Trip...' : 'Add Trip'}
          </Button>
        </ActionSection>
      </StyledDialog>
    </>
  );
});

AddTripModal.displayName = 'AddTripModal';

export default AddTripModal; 