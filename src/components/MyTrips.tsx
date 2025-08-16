import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  TextField,
  FormControlLabel,
  Checkbox,
  Snackbar,
  IconButton,
  Divider,
  LinearProgress,
  Paper,
} from '@mui/material';
import { 
  Edit as EditIcon,
  Flight as FlightIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  Close as CloseIcon,
  ArrowBackIos as ArrowBackIcon,
  ArrowForwardIos as ArrowForwardIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { generateClient } from 'aws-amplify/api';
import { type Schema } from '../../amplify/data/resource';
import { getCurrentUser } from 'aws-amplify/auth';
import { dateFormatter } from '../utils/dateFormatter';
import { getTripStatus as getEnhancedTripStatus, TripStatusResult, formatTripStatus } from '../utils/tripStatus';
import { styled } from '@mui/material/styles';
import { CustomDateInput } from './CustomDateInput';
import VirtualizedCityDropdown from './VirtualizedCityDropdown';
import AddTripModal from './AddTripModal';

type TripFromDB = Schema["Trips"]["type"];

const LANGUAGE_OPTIONS = [
  'English', 'Hindi', 'Assamese', 'Bengali', 'Gujarati', 'Kannada', 
  'Kashmiri', 'Konkani', 'Malayalam', 'Marathi', 'Mandarin (Chinese)', 
  'Nepali', 'Odia', 'Punjabi', 'Sindhi', 'Tamil', 'Telugu', 'Urdu', 'Other'
];

// Color constants for alternating section backgrounds
const SECTION_COLORS = {
  yellowish: '#FFF8E1', // Light yellow/cream matching current style
  white: '#FFFFFF'      // Pure white
} as const;

// Utility function for alternating colors
const getSectionBackgroundColor = (index: number): string => {
  return index % 2 === 0 ? SECTION_COLORS.yellowish : SECTION_COLORS.white;
};

interface EditTripData {
  fromCity: string;
  toCity: string;
  layoverCities: string[];
  flightDate: string;
  flightTime: string;
  confirmed: boolean;
  flightDetails: string;
  languagePreferences: string[];
}

interface TripPaginationState {
  currentPage: number;
  tripsPerPage: number;
  totalTrips: number;
}

// Styled components for enhanced Edit Trip dialog
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
  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
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

const MyTrips: React.FC = () => {
  const [trips, setTrips] = useState<TripFromDB[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<TripFromDB | null>(null);
  const [editFormData, setEditFormData] = useState<EditTripData>({
    fromCity: '',
    toCity: '',
    layoverCities: [],
    flightDate: '',
    flightTime: '',
    confirmed: false,
    flightDetails: '',
    languagePreferences: []
  });
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Enhanced edit dialog states
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);
  const [languageSearchTerm, setLanguageSearchTerm] = useState('');
  const [airportData, setAirportData] = useState<Schema["Airports"]["type"][]>([]);

  // Refs for outside click detection
  const languageInputRef = useRef<HTMLDivElement>(null);
  const languageDropdownRef = useRef<HTMLDivElement>(null);

  // Add Trip Modal state
  const [addTripModalOpen, setAddTripModalOpen] = useState(false);

  // Pagination state - 3 trips per page as specified
  const [paginationState, setPaginationState] = useState<TripPaginationState>({
    currentPage: 0,
    tripsPerPage: 3, // Always 3 trips per page as per requirements
    totalTrips: 0
  });

  // Fetch user trips on component mount
  useEffect(() => {
    fetchUserTrips();
  }, []);

  // Load airport data for enhanced dropdowns
  useEffect(() => {
    const loadAirportData = async () => {
      try {
        const client = generateClient<Schema>();
        let allAirports: Schema["Airports"]["type"][] = [];
        let nextToken;
        
        do {
          const result: any = await client.models.Airports.list({
            limit: 1000,
            nextToken
          });
          if (result.data) {
            allAirports = allAirports.concat(result.data);
          }
          nextToken = result.nextToken;
        } while (nextToken);
        
        setAirportData(allAirports);
      } catch (error) {
        console.error('Error loading airport data:', error);
      }
    };
    
    loadAirportData();
  }, []);

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


  const fetchUserTrips = async () => {
    try {
      setLoading(true);
      const user = await getCurrentUser();
      const email = user.signInDetails?.loginId || user.username;

      const client = generateClient<Schema>();
      const result = await client.models.Trips.list({
        filter: {
          userEmail: { eq: email }
        }
      });

      if (result.data) {
        // Sort trips by creation date (newest first)
        const sortedTrips = result.data.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setTrips(sortedTrips);
      }
    } catch (err: any) {
      console.error('Error fetching user trips:', err);
      setError('Failed to load your trips. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getTripStatus = (trip: TripFromDB): TripStatusResult => {
    return getEnhancedTripStatus({
      departureDate: trip.flightDate,
      returnDate: undefined, // Not available in current schema
      flightTime: trip.flightDetails // Use flight details for estimation hints
    });
  };

  const handleEditClick = (trip: TripFromDB) => {
    setSelectedTrip(trip);
    
    // Ensure we handle all possible data structures for languagePreferences
    let languages: string[] = [];
    if (trip.languagePreferences) {
      if (Array.isArray(trip.languagePreferences)) {
        languages = trip.languagePreferences.filter((lang): lang is string => 
          lang !== null && lang !== undefined && lang !== ''
        );
      } else if (typeof trip.languagePreferences === 'string') {
        // Handle case where it might be a string (shouldn't happen but defensive coding)
        try {
          const parsed = JSON.parse(trip.languagePreferences);
          if (Array.isArray(parsed)) {
            languages = parsed.filter((lang): lang is string => 
              lang !== null && lang !== undefined && lang !== ''
            );
          }
        } catch (e) {
          console.warn('Could not parse languagePreferences as JSON:', trip.languagePreferences);
          languages = [];
        }
      }
    }
    
    setEditFormData({
      fromCity: trip.fromCity,
      toCity: trip.toCity,
      layoverCities: trip.layoverCity ? trip.layoverCity.filter(city => city !== null) : [],
      flightDate: trip.flightDate ? dateFormatter.formatDate(new Date(trip.flightDate)) : '',
      flightTime: trip.flightTime || '',
      confirmed: trip.confirmed,
      flightDetails: trip.flightDetails || '',
      languagePreferences: languages
    });
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedTrip(null);
    setEditFormData({
      fromCity: '',
      toCity: '',
      layoverCities: [],
      flightDate: '',
      flightTime: '',
      confirmed: false,
      flightDetails: '',
      languagePreferences: []
    });
    setEditErrors({});
    setLanguageDropdownOpen(false);
    setLanguageSearchTerm('');
  };

  const handleSaveTrip = async () => {
    if (!selectedTrip) return;

    try {
      setSaving(true);
      const client = generateClient<Schema>();
      
      // Validate form before saving
      const newErrors: Record<string, string> = {};
      
      if (!editFormData.flightDate) {
        newErrors.flightDate = 'Flight date is required';
      } else {
        const dateError = dateFormatter.getValidationError(editFormData.flightDate);
        if (dateError) {
          newErrors.flightDate = dateError;
        }
      }
      
      if (Object.keys(newErrors).length > 0) {
        setEditErrors(newErrors);
        setSaving(false);
        return;
      }
      
      // Convert date back to database format (YYYY-MM-DD)
      const dbDate = editFormData.flightDate ? dateFormatter.convertToStandardDate(editFormData.flightDate) : '';
      
      // Update the trip
      await client.models.Trips.update({
        tripId: selectedTrip.tripId,
        fromCity: editFormData.fromCity,
        toCity: editFormData.toCity,
        layoverCity: editFormData.layoverCities,
        flightDate: dbDate,
        flightTime: editFormData.flightTime,
        confirmed: editFormData.confirmed,
        flightDetails: editFormData.flightDetails,
        languagePreferences: editFormData.languagePreferences
      });

      setSuccessMessage('Trip updated successfully!');
      handleCloseEditDialog();
      fetchUserTrips(); // Refresh the trips list
    } catch (err: any) {
      console.error('Error updating trip:', err);
      setError('Failed to update trip. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleFormChange = (field: keyof EditTripData, value: any) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (editErrors[field]) {
      setEditErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Date field change handler with validation
  const handleDateChange = (value: string) => {
    setEditFormData(prev => ({ ...prev, flightDate: value }));
    
    // Clear existing error
    if (editErrors.flightDate) {
      setEditErrors(prev => ({ ...prev, flightDate: '' }));
    }
    
    // Validate date format and future date requirement
    if (value) {
      const error = dateFormatter.getValidationError(value);
      if (error) {
        setEditErrors(prev => ({ ...prev, flightDate: error }));
      }
    }
  };

  // Enhanced form handlers for city dropdowns
  const handleFromCityChange = (value: string | string[]) => {
    const cityValue = Array.isArray(value) ? value[0] : value;
    handleFormChange('fromCity', cityValue);
  };

  const handleToCityChange = (value: string | string[]) => {
    const cityValue = Array.isArray(value) ? value[0] : value;
    handleFormChange('toCity', cityValue);
  };

  const handleLayoverCitiesChange = (value: string | string[]) => {
    const citiesValue = Array.isArray(value) ? value : [value].filter(Boolean);
    handleFormChange('layoverCities', citiesValue);
  };

  // Language preference handlers
  const handleLanguageToggle = (language: string) => {
    setEditFormData(prev => {
      const updatedLanguages = prev.languagePreferences.includes(language)
        ? prev.languagePreferences.filter(lang => lang !== language)
        : [...prev.languagePreferences, language];
      return { ...prev, languagePreferences: updatedLanguages };
    });
  };

  const handleLanguageChipDelete = (languageToDelete: string) => {
    setEditFormData(prev => ({
      ...prev,
      languagePreferences: prev.languagePreferences.filter(lang => lang !== languageToDelete)
    }));
  };

  const clearAllLanguages = () => {
    setEditFormData(prev => ({ ...prev, languagePreferences: [] }));
  };

  // Add Trip Modal handlers
  const handleOpenAddTripModal = () => {
    setAddTripModalOpen(true);
  };

  const handleCloseAddTripModal = () => {
    setAddTripModalOpen(false);
  };

  const handleAddTripSubmit = async (tripData: any) => {
    try {
      // Get current user's email
      const user = await getCurrentUser();
      const userEmail = user.signInDetails?.loginId || user.username;
      if (!userEmail) {
        setSuccessMessage('⚠️ Please sign in or register to add a trip');
        handleCloseAddTripModal();
        return;
      }

      // Explicitly check for empty strings for required fields
      if (!tripData.fromCity || tripData.fromCity.trim() === '') {
         setSuccessMessage('Something went wrong: From City is required.');
         handleCloseAddTripModal();
         return;
      }
      if (!tripData.toCity || tripData.toCity.trim() === '') {
         setSuccessMessage('Something went wrong: To City is required.');
         handleCloseAddTripModal();
         return;
      }
      if (!tripData.flightDate || tripData.flightDate.trim() === '') {
         setSuccessMessage('⚠️ Flight date is required.');
         handleCloseAddTripModal();
         return;
      }

      // Convert date from display format to database format if needed
      let formattedDate = tripData.flightDate;
      if (formattedDate && !formattedDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        try {
          formattedDate = dateFormatter.convertToStandardDate(formattedDate);
        } catch (dateError) {
          setSuccessMessage('⚠️ Invalid date format. Please use DD/MM/YYYY.');
          handleCloseAddTripModal();
          return;
        }
      }

      const client = generateClient<Schema>();
      
      // Generate unique trip ID
      const tripId = `trip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await client.models.Trips.create({
        tripId: tripId,
        userEmail: userEmail,
        fromCity: tripData.fromCity,
        toCity: tripData.toCity,
        layoverCity: tripData.layoverCities || [],
        flightDate: formattedDate,
        flightTime: tripData.flightTime,
        confirmed: tripData.isBooked,
        flightDetails: tripData.flightDetails || '',
        languagePreferences: tripData.languagePreferences || [],
        createdAt: new Date().toISOString(),
      });

      setSuccessMessage(`Trip from ${tripData.fromCity} to ${tripData.toCity} added successfully!`);
      handleCloseAddTripModal();
      fetchUserTrips(); // Refresh the trips list
    } catch (dbError: any) {
      setSuccessMessage('Something went wrong. Please try again.');
      handleCloseAddTripModal();
    }
  };

  // Filtered languages for search
  const filteredLanguages = LANGUAGE_OPTIONS.filter(language =>
    language.toLowerCase().includes(languageSearchTerm.toLowerCase())
  );

  // Pagination functions
  const handleNextPage = () => {
    const totalPages = Math.ceil(paginationState.totalTrips / paginationState.tripsPerPage);
    setPaginationState(prev => ({
      ...prev,
      currentPage: Math.min(prev.currentPage + 1, totalPages - 1)
    }));
  };

  const handlePreviousPage = () => {
    setPaginationState(prev => ({
      ...prev,
      currentPage: Math.max(0, prev.currentPage - 1)
    }));
  };

  const getCurrentTrips = (): TripFromDB[] => {
    if (!trips || trips.length === 0) {
      return [];
    }
    
    const startIndex = paginationState.currentPage * paginationState.tripsPerPage;
    const endIndex = startIndex + paginationState.tripsPerPage;
    
    // Ensure we don't go beyond array bounds
    const validStartIndex = Math.max(0, Math.min(startIndex, trips.length - 1));
    const validEndIndex = Math.min(endIndex, trips.length);
    
    return trips.slice(validStartIndex, validEndIndex);
  };

  const shouldShowNextArrow = (): boolean => {
    if (paginationState.totalTrips <= paginationState.tripsPerPage) {
      return false;
    }
    const totalPages = Math.ceil(paginationState.totalTrips / paginationState.tripsPerPage);
    return paginationState.currentPage < totalPages - 1;
  };

  const shouldShowPreviousArrow = (): boolean => {
    return paginationState.currentPage > 0 && paginationState.totalTrips > paginationState.tripsPerPage;
  };

  // Update pagination state when trips change
  useEffect(() => {
    setPaginationState(prev => ({
      ...prev,
      totalTrips: trips.length,
      currentPage: 0 // Reset to first page when trips data changes
    }));
  }, [trips]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Typography variant="h5" sx={{ 
          fontWeight: 700, 
          color: '#2C3E50',
          fontSize: { xs: '1.25rem', sm: '1.5rem' }
        }}>
          My Trips
        </Typography>
        {trips.length > 0 && (
          <Typography variant="body2" sx={{ 
            color: '#6C757D',
            fontWeight: 500,
            fontSize: { xs: '0.875rem', sm: '1rem' }
          }}>
            {trips.length} trip{trips.length !== 1 ? 's' : ''} total
          </Typography>
        )}
      </Box>

      {trips.length === 0 ? (
        <Box sx={{ 
          textAlign: 'center',
          py: 8,
          px: 4,
          background: 'linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%)',
          borderRadius: 4,
          border: '2px dashed #fed7aa',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Background Pattern */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23fed7aa' fill-opacity='0.3'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              opacity: 0.5,
              zIndex: 0
            }}
          />
          
          {/* Content */}
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Box
              sx={{
                width: 120,
                height: 120,
                margin: '0 auto 24px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 32px rgba(245, 158, 11, 0.4)',
                animation: 'float 3s ease-in-out infinite',
                '@keyframes float': {
                  '0%, 100%': {
                    transform: 'translateY(0)',
                  },
                  '50%': {
                    transform: 'translateY(-10px)',
                  },
                },
              }}
            >
              <FlightIcon sx={{ fontSize: 56, color: 'white' }} />
            </Box>
            
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 800,
                color: '#0f172a',
                mb: 2,
                fontSize: { xs: '1.5rem', sm: '2rem' }
              }}
            >
              Your Adventure Awaits
            </Typography>
            
            <Typography 
              variant="body1" 
              sx={{ 
                color: '#64748b',
                fontSize: '1.1rem',
                lineHeight: 1.6,
                mb: 4,
                maxWidth: 400,
                margin: '0 auto 32px'
              }}
            >
              Ready to explore the world? Create your first trip and start planning your next adventure!
            </Typography>
            
            <Button
              variant="contained"
              size="large"
              startIcon={<FlightIcon />}
              onClick={handleOpenAddTripModal}
              sx={{
                bgcolor: '#f59e0b',
                color: 'white',
                fontWeight: 700,
                fontSize: '1.1rem',
                px: 4,
                py: 2,
                borderRadius: 4,
                textTransform: 'none',
                boxShadow: '0 8px 25px rgba(245, 158, 11, 0.4)',
                '&:hover': {
                  bgcolor: '#d97706',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 35px rgba(245, 158, 11, 0.5)',
                }
              }}
            >
              Create Your First Trip
            </Button>
            
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 4, flexWrap: 'wrap' }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#f59e0b', mb: 0.5 }}>
                  ✈️
                </Typography>
                <Typography variant="caption" sx={{ color: '#92400e', fontWeight: 600 }}>
                  Plan Routes
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#f59e0b', mb: 0.5 }}>
                  🗓️
                </Typography>
                <Typography variant="caption" sx={{ color: '#92400e', fontWeight: 600 }}>
                  Set Dates
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#f59e0b', mb: 0.5 }}>
                  🌍
                </Typography>
                <Typography variant="caption" sx={{ color: '#92400e', fontWeight: 600 }}>
                  Explore World
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      ) : (
        <Box>
          {/* Navigation and Trips Container */}
          <Box sx={{ position: 'relative' }}>
            {/* Previous Arrow */}
            {shouldShowPreviousArrow() && (
              <IconButton
                onClick={handlePreviousPage}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handlePreviousPage();
                  }
                }}
                sx={{
                  position: 'absolute',
                  left: { xs: -12, md: -16 },
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 2,
                  bgcolor: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  width: { xs: 36, md: 40 },
                  height: { xs: 36, md: 40 },
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: 'rgba(245, 158, 11, 0.2)',
                    transform: 'translateY(-50%) translateX(-2px)',
                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                  },
                  '&:focus': {
                    outline: '2px solid #f59e0b',
                    outlineOffset: '2px',
                  }
                }}
                aria-label="Previous trips"
              >
                <ArrowBackIcon sx={{ fontSize: 18, color: '#f59e0b' }} />
              </IconButton>
            )}

            {/* Next Arrow */}
            {shouldShowNextArrow() && (
              <IconButton
                onClick={handleNextPage}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleNextPage();
                  }
                }}
                sx={{
                  position: 'absolute',
                  right: { xs: -12, md: -16 },
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 2,
                  bgcolor: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  width: { xs: 36, md: 40 },
                  height: { xs: 36, md: 40 },
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: 'rgba(245, 158, 11, 0.2)',
                    transform: 'translateY(-50%) translateX(2px)',
                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                  },
                  '&:focus': {
                    outline: '2px solid #f59e0b',
                    outlineOffset: '2px',
                  }
                }}
                aria-label="Next trips"
              >
                <ArrowForwardIcon sx={{ fontSize: 18, color: '#f59e0b' }} />
              </IconButton>
            )}

            {/* Trips Grid - Optimized for 3 trips maximum */}
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: { 
                xs: '1fr', 
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)'
              },
              gap: 3,
              transition: 'all 0.3s ease',
              width: '100%'
            }}>
              {getCurrentTrips().map((trip) => {
            const tripStatus = getTripStatus(trip);
            return (
              <Card 
                key={trip.tripId}
                elevation={0}
                sx={{ 
                  borderRadius: 3,
                  border: '1px solid rgba(0,0,0,0.08)',
                  background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
                  overflow: 'hidden',
                  position: 'relative',
                  transition: 'all 0.3s ease',
                  height: 'fit-content',
                  minHeight: { xs: 'auto', md: '420px' }, // Consistent card heights on larger screens
                  display: 'flex',
                  flexDirection: 'column',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 4,
                    background: `linear-gradient(90deg, ${
                      tripStatus.color === 'success' ? '#10b981' :
                      tripStatus.color === 'warning' ? '#f59e0b' :
                      tripStatus.color === 'info' ? '#3b82f6' :
                      '#6b7280'
                    }, ${
                      tripStatus.color === 'success' ? '#059669' :
                      tripStatus.color === 'warning' ? '#d97706' :
                      tripStatus.color === 'info' ? '#2563eb' :
                      '#4b5563'
                    })`,
                    zIndex: 1,
                  }
                }}
              >
                <CardContent sx={{ p: { xs: 2, md: 3 }, pb: 1, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {/* Trip Status Chips */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                    <Chip 
                      label={formatTripStatus(tripStatus, true)}
                      size="small"
                      sx={{ 
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        bgcolor: tripStatus.bgColor,
                        color: tripStatus.textColor,
                        border: `1px solid ${
                          tripStatus.color === 'success' ? '#a7f3d0' :
                          tripStatus.color === 'warning' ? '#fde68a' : 
                          tripStatus.color === 'info' ? '#93c5fd' : '#d1d5db'
                        }`,
                        '&:hover': {
                          opacity: 0.8,
                          transform: 'scale(1.02)',
                        },
                        transition: 'all 0.2s ease'
                      }}
                    />
                    <Chip 
                      label={trip.confirmed ? 'Booked' : 'Not Booked'}
                      size="small"
                      sx={{
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        bgcolor: trip.confirmed ? '#d1fae5' : '#fef2f2',
                        color: trip.confirmed ? '#065f46' : '#991b1b',
                        border: `1px solid ${trip.confirmed ? '#a7f3d0' : '#fecaca'}`,
                      }}
                    />
                  </Box>

                  {/* Route with enhanced styling */}
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    mb: 3, 
                    p: 2, 
                    borderRadius: 2, 
                    bgcolor: getSectionBackgroundColor(0), // Section 1 - yellowish
                    border: '1px solid #e2e8f0'
                  }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        bgcolor: '#f59e0b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2,
                        boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)',
                      }}
                    >
                      <LocationIcon sx={{ color: 'white', fontSize: 20 }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body1" sx={{ 
                        fontWeight: 700, 
                        fontSize: '1.1rem',
                        color: '#0f172a',
                        lineHeight: 1.2
                      }}>
                        {trip.fromCity} → {trip.toCity}
                      </Typography>
                      <Typography variant="caption" sx={{ 
                        color: '#64748b',
                        fontWeight: 500,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5
                      }}>
                        Flight Route
                      </Typography>
                    </Box>
                  </Box>

                  {/* Date and Time */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, p: 2, borderRadius: 2, bgcolor: getSectionBackgroundColor(1) }}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        bgcolor: '#f59e0b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2,
                      }}
                    >
                      <CalendarIcon sx={{ color: 'white', fontSize: 16 }} />
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#2C3E50' }}>
                        {trip.flightDate ? dateFormatter.formatDate(new Date(trip.flightDate)) : 'No date set'}
                      </Typography>
                      {trip.flightTime && (
                        <Typography variant="caption" sx={{ color: '#6C757D' }}>
                          Departure: {trip.flightTime.slice(0, 5)}
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  {/* Layover Cities */}
                  {trip.layoverCity && trip.layoverCity.length > 0 && (
                    <Box sx={{ mb: 2, p: 2, borderRadius: 2, bgcolor: getSectionBackgroundColor(2), border: '1px solid #fed7aa' }}>
                      <Typography variant="caption" sx={{ 
                        color: '#9a3412', 
                        fontWeight: 600, 
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        display: 'block',
                        mb: 0.5
                      }}>
                        Layover Cities
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#ea580c', fontWeight: 500 }}>
                        {trip.layoverCity.filter(city => city !== null).join(' • ')}
                      </Typography>
                    </Box>
                  )}

                  {/* Flight Details */}
                  {trip.flightDetails && (
                    <Box sx={{ mb: 2, p: 2, borderRadius: 2, bgcolor: getSectionBackgroundColor(3), border: '1px solid #fde68a' }}>
                      <Typography variant="caption" sx={{ 
                        color: '#2C3E50', 
                        fontWeight: 600, 
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        display: 'block',
                        mb: 0.5
                      }}>
                        Flight Details
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: '#374151',
                          fontWeight: 500,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          lineHeight: 1.4
                        }}
                      >
                        {trip.flightDetails}
                      </Typography>
                    </Box>
                  )}

                  {/* Language Preferences */}
                  {trip.languagePreferences && trip.languagePreferences.length > 0 && (
                    <Box sx={{ mb: 2, p: 2, borderRadius: 2, bgcolor: getSectionBackgroundColor(4) }}>
                      <Typography variant="caption" sx={{ 
                        color: '#64748b', 
                        fontWeight: 600, 
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        display: 'block',
                        mb: 1
                      }}>
                        Languages
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {trip.languagePreferences.filter(lang => lang !== null).map((lang, index) => (
                          <Chip
                            key={index}
                            label={lang}
                            size="small"
                            sx={{
                              bgcolor: '#f1f5f9',
                              color: '#475569',
                              fontSize: '0.7rem',
                              fontWeight: 500,
                              height: 24,
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                </CardContent>

                <Divider sx={{ borderColor: '#e2e8f0' }} />

                <CardActions sx={{ p: { xs: 2, md: 3 }, pt: 2, bgcolor: '#fafbfc', mt: 'auto' }}>
                  <Button
                    startIcon={<EditIcon />}
                    onClick={() => handleEditClick(trip)}
                    variant="contained"
                    sx={{ 
                      textTransform: 'none',
                      fontWeight: 600,
                      borderRadius: 2,
                      px: 3,
                      py: 1,
                      bgcolor: '#f59e0b',
                      boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                      '&:hover': {
                        bgcolor: '#d97706',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 6px 16px rgba(245, 158, 11, 0.4)',
                      }
                    }}
                  >
                    Edit Trip
                  </Button>
                </CardActions>
              </Card>
            );
              })}
            </Box>
          </Box>
        </Box>
      )}

      {/* Enhanced Edit Trip Dialog - Matching Add Trip Layout */}
      <StyledDialog 
        open={editDialogOpen} 
        onClose={handleCloseEditDialog}
        maxWidth="sm" 
        fullWidth
      >
        {/* Enhanced Header with Progress Indicator */}
        <HeaderSection>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box sx={{ zIndex: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
                Edit Your Trip
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Update your travel details
              </Typography>
            </Box>
            <IconButton 
              onClick={handleCloseEditDialog} 
              sx={{ 
                color: 'white', 
                zIndex: 1,
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
          {saving && (
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
          <Box component="form" noValidate autoComplete="off" display="flex" flexDirection="column" gap={2.5}>
            {/* Enhanced From City Dropdown */}
            <VirtualizedCityDropdown
              label="From City"
              placeholder="Select departure city..."
              value={editFormData.fromCity}
              onChange={handleFromCityChange}
              options={airportData}
              isLoading={airportData.length === 0}
              error={editErrors.fromCity}
              dropdownType="from"
              disabled={saving}
              required
            />

            {/* Enhanced To City Dropdown */}
            <VirtualizedCityDropdown
              label="To City"
              placeholder="Select destination city..."
              value={editFormData.toCity}
              onChange={handleToCityChange}
              options={airportData}
              isLoading={airportData.length === 0}
              error={editErrors.toCity}
              dropdownType="to"
              disabled={saving}
              required
            />

            {/* Enhanced Layover Cities Multi-Select Dropdown */}
            <VirtualizedCityDropdown
              label="Layover Cities (optional - max 3)"
              placeholder="Add layover cities..."
              value={editFormData.layoverCities}
              onChange={handleLayoverCitiesChange}
              options={airportData}
              isLoading={airportData.length === 0}
              error={editErrors.layoverCities}
              multiSelect
              maxSelections={3}
              dropdownType="layover"
              disabled={saving}
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
                    checked={editFormData.confirmed} 
                    onChange={(e) => handleFormChange('confirmed', e.target.checked)} 
                    name="confirmed"
                    disabled={saving}
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
                      {editFormData.confirmed ? 'Flight time will be required' : 'Flight time is optional'}
                    </Typography>
                  </Box>
                }
              />
            </Box>

            {/* Enhanced Date Input */}
            <CustomDateInput
              label="Flight Date*"
              value={editFormData.flightDate}
              onChange={handleDateChange}
              error={!!editErrors.flightDate}
              helperText={editErrors.flightDate}
              fullWidth
              margin="normal"
              disabled={saving}
            />

            {/* Enhanced Time Input */}
            <TextField
              label={editFormData.confirmed ? 'Flight Time*' : 'Flight Time'}
              name="flightTime"
              type="time"
              value={editFormData.flightTime}
              onChange={(e) => handleFormChange('flightTime', e.target.value)}
              error={!!editErrors.flightTime}
              helperText={editErrors.flightTime || (editFormData.confirmed ? 'Required when booking is confirmed' : 'Optional')}
              fullWidth
              margin="normal"
              disabled={saving}
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
                  color: editErrors.languagePreferences ? 'error.main' : 'text.secondary',
                  zIndex: 1
                }}
              >
                Language Preferences{' '}
                <Box component="span" sx={{ color: 'error.main' }}>*</Box>
              </Typography>
              
              <LanguageInputField
                ref={languageInputRef}
                onClick={() => !saving && setLanguageDropdownOpen(!languageDropdownOpen)}
                tabIndex={0}
                role="combobox"
                aria-expanded={languageDropdownOpen}
                aria-haspopup="listbox"
                aria-label="Language Preferences"
                sx={{
                  borderColor: editErrors.languagePreferences ? 'error.main' : 'divider',
                  opacity: saving ? 0.6 : 1,
                  cursor: saving ? 'not-allowed' : 'pointer'
                }}
              >
                {editFormData.languagePreferences.length === 0 ? (
                  <Typography variant="body2" sx={{ color: 'text.secondary', flexGrow: 1 }}>
                    Select languages...
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, flexGrow: 1 }}>
                    {editFormData.languagePreferences.map((language) => (
                      <Chip
                        key={language}
                        label={language}
                        onDelete={() => !saving && handleLanguageChipDelete(language)}
                        size="small"
                        sx={{
                          backgroundColor: '#E8F5E8',
                          '& .MuiChip-deleteIcon': { fontSize: 16 }
                        }}
                      />
                    ))}
                  </Box>
                )}
                
                {saving ? (
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

              {languageDropdownOpen && !saving && (
                <LanguageDropdown ref={languageDropdownRef}>
                  <Box sx={{ p: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <TextField
                      placeholder="Search languages..."
                      variant="outlined"
                      size="small"
                      fullWidth
                      value={languageSearchTerm}
                      onChange={(e) => setLanguageSearchTerm(e.target.value)}
                      autoFocus
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': {
                            border: 'none',
                          },
                        },
                        '& .MuiInputBase-input': {
                          padding: '8px 12px',
                          fontSize: '14px',
                        },
                      }}
                    />
                  </Box>
                  
                  {editFormData.languagePreferences.length > 0 && (
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
                      const isSelected = editFormData.languagePreferences.includes(language);
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
              
              {editErrors.languagePreferences && (
                <Typography variant="caption" sx={{ color: 'error.main', mt: 0.5, ml: 1.5, fontSize: 12 }}>
                  {editErrors.languagePreferences}
                </Typography>
              )}
            </LanguageDropdownContainer>

            {/* Enhanced Flight Details */}
            <TextField
              label="Flight Details (optional)"
              name="flightDetails"
              value={editFormData.flightDetails}
              onChange={(e) => handleFormChange('flightDetails', e.target.value)}
              error={!!editErrors.flightDetails}
              helperText={
                editErrors.flightDetails ||
                `${editFormData.flightDetails.length}/250 characters`
              }
              fullWidth
              multiline
              rows={3}
              margin="normal"
              disabled={saving}
              placeholder="Add airline, flight number, seat preferences, or other travel details..."
              inputProps={{
                maxLength: 250
              }}
              sx={{
                '& .MuiInputBase-input': {
                  fontSize: '16px' // Prevents zoom on mobile
                }
              }}
            />
          </Box>
        </FormSection>
        
        {/* Enhanced Action Section */}
        <ActionSection>
          <Button 
            onClick={handleCloseEditDialog} 
            color="inherit"
            disabled={saving}
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
            onClick={handleSaveTrip} 
            variant="contained"
            disabled={saving}
            startIcon={
              saving ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <EditIcon />
              )
            }
            sx={(theme) => ({
              minWidth: 140,
              background: 'linear-gradient(45deg, #f59e0b 30%, #d97706 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #d97706 30%, #b45309 90%)',
              },
              '&:disabled': {
                background: 'rgba(0, 0, 0, 0.12)'
              },
              [theme.breakpoints.down('sm')]: {
                order: 1
              }
            })}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </ActionSection>
      </StyledDialog>

      {/* Success/Error Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSuccessMessage(null)} 
          severity="success"
          sx={{ width: '100%' }}
        >
          {successMessage}
        </Alert>
      </Snackbar>

      {/* Add Trip Modal */}
      <AddTripModal 
        open={addTripModalOpen}
        onClose={handleCloseAddTripModal}
        onSubmit={handleAddTripSubmit}
        airportData={airportData}
        isLoading={airportData.length === 0}
      />
    </Box>
  );
};

export default MyTrips;