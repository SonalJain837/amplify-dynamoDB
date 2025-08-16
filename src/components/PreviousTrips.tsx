import * as React from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Paper, 
  InputAdornment,
  CircularProgress,
  useMediaQuery,
  useTheme,
  Tooltip,
  Snackbar,
  Alert,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import PersonIcon from '@mui/icons-material/Person';
import MessageIcon from '@mui/icons-material/Message';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import { DataGrid, GridColDef, GridCellParams } from '@mui/x-data-grid';
import { generateClient } from 'aws-amplify/api';
import { type Schema } from '../../amplify/data/resource';
import { useDebounce } from 'use-debounce';
import { useNavigate } from 'react-router-dom';
import CommentModal from './CommentModal';
import { useUser } from '../contexts/UserContext';
import { sendCommentEmail } from '../graphql/mutations';
import { formatDateToDDMONYYYY } from '../utils/dateUtils';
import { getAirportLocationInfo } from '../utils/airportUtils';

interface PreviousTripsProps {
  onClose?: () => void;
  onContactTraveler?: (travelerData: any) => void;
}

interface TripData {
  id: string;
  tripId: string;
  from: string;
  to: string;
  layover: string;
  date: string;
  time: string;
  booked: string;
  flight: string;
  languagePreference: string;
}

export default function PreviousTrips({ onClose, onContactTraveler }: PreviousTripsProps) {
  const customTheme = useTheme();
  const isMobile = useMediaQuery(customTheme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(customTheme.breakpoints.down('md'));
  const navigate = useNavigate();
  
  // Use shared user context
  const { userData } = useUser();
  const { isSignedIn, userEmail } = userData;

  const [search, setSearch] = React.useState('');
  const [debouncedSearch] = useDebounce(search, 300);
  const [previousTrips, setPreviousTrips] = React.useState<TripData[]>([]);
  const [filteredPreviousTrips, setFilteredPreviousTrips] = React.useState<TripData[]>([]);
  const [loadingPreviousTrips, setLoadingPreviousTrips] = React.useState(false);
  const [previousTripsPageTokens, setPreviousTripsPageTokens] = React.useState<(string | undefined)[]>([undefined]);
  const [previousTripsRowCount, setPreviousTripsRowCount] = React.useState<number>(0);
  const [searchLoading, setSearchLoading] = React.useState(false);
  const [paginationModel, setPaginationModel] = React.useState({ pageSize: 100, page: 0 });
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [openCommentModal, setOpenCommentModal] = React.useState(false);
  const [selectedRowData, setSelectedRowData] = React.useState<any>(null);
  const [airportData, setAirportData] = React.useState<Schema["Airports"]["type"][]>([]);
  const [columnVisibilityModel, setColumnVisibilityModel] = React.useState({
    layover: !isMobile,
    time: !(isMobile && !isTablet),
    flight: !(isMobile && !isTablet && window.innerWidth < 400)
  });
  const [airportDataLoaded, setAirportDataLoaded] = React.useState(false);

  // Create optimized airport lookup maps for faster searching
  const airportLookupMaps = React.useMemo(() => {
    const cityMap = new Map<string, Schema["Airports"]["type"]>();
    const iataMap = new Map<string, Schema["Airports"]["type"]>();
    const nameMap = new Map<string, Schema["Airports"]["type"]>();
    
    airportData.forEach(airport => {
      if (airport.city) {
        cityMap.set(airport.city.toLowerCase(), airport);
      }
      if (airport.IATA) {
        iataMap.set(airport.IATA, airport);
      }
      if (airport.airportName) {
        nameMap.set(airport.airportName.toLowerCase(), airport);
      }
    });
    
    return { cityMap, iataMap, nameMap };
  }, [airportData]);

  // Memoized function to format city display with loading state
  const formatCityDisplay = React.useCallback((cityValue: string) => {
    if (!cityValue) return { displayText: cityValue, tooltipText: 'Country not found', isLoading: false };
    
    // If airport data is still loading, show original value without processing
    if (!airportDataLoaded || airportData.length === 0) {
      return { 
        displayText: cityValue, 
        tooltipText: 'Loading country information...', 
        isLoading: true 
      };
    }
    
    // Fast lookup using Maps instead of array.find()
    const { cityMap, iataMap, nameMap } = airportLookupMaps;
    
    let airportInfo = iataMap.get(cityValue) || 
                     cityMap.get(cityValue.toLowerCase()) || 
                     nameMap.get(cityValue.toLowerCase());
    
    // Display format: "CityName (Code)" or existing value if no airport data found
    let displayText = cityValue;
    if (airportInfo) {
      const cityName = airportInfo.city || cityValue;
      const code = airportInfo.IATA || cityValue;
      displayText = `${cityName} (${code})`;
    }
    const tooltipText = airportInfo?.country || 'Country not found';
    
    return { displayText, tooltipText, isLoading: false };
  }, [airportLookupMaps, airportData.length, airportDataLoaded]);

  // Optimized airport data loading - use cache first, then fetch if needed
  React.useEffect(() => {
    const loadAirportData = async () => {
      // Check cache first for faster loading
      const cachedAirports = localStorage.getItem('airportData');
      if (cachedAirports) {
        try {
          const parsed = JSON.parse(cachedAirports);
          setAirportData(parsed);
          setAirportDataLoaded(true);
          return; // Use cached data, no need to fetch
        } catch (e) {
          console.warn('Failed to parse cached airport data');
          localStorage.removeItem('airportData');
        }
      }

      // Fetch from server only if cache is missing or invalid
      try {
        const client = generateClient<Schema>();
        let allAirports: Schema["Airports"]["type"][] = [];
        let nextToken: string | null | undefined = undefined;
        
        do {
          const result: any = await client.models.Airports.list({
            limit: 1000,
            nextToken: nextToken || undefined
          });
          if (result.data) {
            allAirports = allAirports.concat(result.data);
          }
          nextToken = result.nextToken || undefined;
        } while (nextToken);
        
        if (allAirports.length > 0) {
          setAirportData(allAirports);
          setAirportDataLoaded(true);
          localStorage.setItem('airportData', JSON.stringify(allAirports));
        }
      } catch (error) {
        console.error('Error loading airport data:', error);
      }
    };
    
    loadAirportData();
  }, []);


  // Generate columns based on screen size
  const responsiveColumns = React.useMemo(() => {
    const showLayover = !isMobile;
    const showTime = !(isMobile && !isTablet);
    const showFlight = !(isMobile && !isTablet && window.innerWidth < 400);
    
    const baseColumns: GridColDef[] = [
      { 
        field: 'from', 
        headerName: 'From City', 
        flex: isMobile ? 1 : 0.8, 
        minWidth: isMobile ? 70 : 90,
        headerAlign: 'left',
        align: 'left',
        headerClassName: 'super-app-theme--header',
        renderCell: (params) => {
          const { displayText, tooltipText, isLoading } = formatCityDisplay(params.value);
          if (!displayText) return '';
          
          return (
            <Tooltip title={tooltipText} placement="top">
              <span style={{ 
                cursor: 'default',
                color: isLoading ? '#666' : 'inherit',
                fontStyle: isLoading ? 'italic' : 'normal'
              }}>
                {displayText}
              </span>
            </Tooltip>
          );
        }
      },
      { 
        field: 'to', 
        headerName: 'To City', 
        flex: isMobile ? 1 : 0.8, 
        minWidth: isMobile ? 70 : 90,
        headerAlign: 'left',
        align: 'left',
        headerClassName: 'super-app-theme--header',
        renderCell: (params) => {
          const { displayText, tooltipText, isLoading } = formatCityDisplay(params.value);
          if (!displayText) return '';
          
          return (
            <Tooltip title={tooltipText} placement="top">
              <span style={{ 
                cursor: 'default',
                color: isLoading ? '#666' : 'inherit',
                fontStyle: isLoading ? 'italic' : 'normal'
              }}>
                {displayText}
              </span>
            </Tooltip>
          );
        }
      },
      { 
        field: 'layover', 
        headerName: 'Layover City', 
        flex: 0.8, 
        minWidth: 80,
        headerAlign: 'left',
        align: 'left',
        headerClassName: showLayover ? 'super-app-theme--header' : 'hidden-column',
      },
      { 
        field: 'date', 
        headerName: 'Date', 
        flex: 0.8, 
        minWidth: 90,
        headerAlign: 'left',
        align: 'left',
        headerClassName: 'super-app-theme--header',
      },
      { 
        field: 'time', 
        headerName: 'Time', 
        flex: 0.6, 
        minWidth: 70,
        headerAlign: 'left',
        align: 'left',
        headerClassName: showTime ? 'super-app-theme--header' : 'hidden-column',
      },
      { 
        field: 'booked', 
        headerName: 'Booked?', 
        flex: 0.6, 
        minWidth: 70,
        headerAlign: 'left',
        align: 'left',
        headerClassName: 'super-app-theme--header',
      },
      { 
        field: 'flight', 
        headerName: isTablet ? 'Flight' : 'Flight Details', 
        flex: 1.1, 
        minWidth: isMobile ? 90 : 110,
        headerAlign: 'left',
        align: 'left',
        headerClassName: showFlight ? 'super-app-theme--header' : 'hidden-column',
        renderCell: (params) => {
          const flightValue = params.value;
          if (!flightValue) return '';
          
          return (
            <Tooltip title={flightValue} placement="top">
              <span 
                style={{ 
                  cursor: 'default',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  display: 'block',
                  width: '100%'
                }}
              >
                {flightValue}
              </span>
            </Tooltip>
          );
        }
      },
      {
        field: 'languagePreference',
        headerName: isTablet ? 'Language' : 'Language Preference',
        flex: 1.0,
        minWidth: isMobile ? 80 : 120,
        headerAlign: 'left',
        align: 'left',
        headerClassName: 'super-app-theme--header',
      },
      {
        field: 'actions',
        headerName: 'Actions',
        flex: 1.0,
        minWidth: 120,
        maxWidth: 150,
        sortable: false,
        filterable: false,
        headerClassName: 'super-app-theme--header',
        renderCell: (cellParams) => {
          const tripId = cellParams.row.tripId || cellParams.row.id;
          return (
            <Box 
              sx={{ 
                display: 'flex', 
                justifyContent: 'center',
                alignItems: 'center',
                gap: 1,
                width: '100%' 
              }}
            >
              <Tooltip title="Contact traveler">
                <QuestionAnswerIcon 
                  sx={{ 
                    color: '#9C27B0', 
                    fontSize: isMobile ? 18 : 22, 
                    cursor: 'pointer',
                    '&:hover': {
                      color: '#7B1FA2'
                    }
                  }} 
                  onClick={e => {
                    e.stopPropagation();
                    if (onContactTraveler) {
                      onContactTraveler({
                        userEmail: cellParams.row.userEmail || `${cellParams.row.ownerName || 'user'}@example.com`,
                        ownerName: cellParams.row.ownerName || cellParams.row.userEmail?.split('@')[0] || 'Traveler',
                        from: cellParams.row.from,
                        to: cellParams.row.to,
                        date: cellParams.row.date,
                        flight: cellParams.row.flight,
                        tripId: cellParams.row.tripId || cellParams.row.id
                      });
                    }
                  }}
                />
              </Tooltip>
              <Tooltip title="Add a comment">
                <ChatBubbleOutlineIcon 
                  sx={{ 
                    color: '#FF8C00', 
                    fontSize: isMobile ? 18 : 22, 
                    cursor: 'pointer',
                    '&:hover': {
                      color: '#FF7700'
                    }
                  }} 
                />
              </Tooltip>
              <Tooltip title="View comments">
                <VisibilityIcon 
                  sx={{ 
                    color: '#1A9698', 
                    fontSize: isMobile ? 18 : 22, 
                    cursor: 'pointer',
                    '&:hover': {
                      color: '#158588'
                    }
                  }} 
                  onClick={e => {
                    e.stopPropagation();
                    if (tripId) {
                      onClose?.(); // Close the drawer
                      navigate(`/trip/${tripId}/comments`);
                    }
                  }}
                />
              </Tooltip>
            </Box>
          );
        },
      },
    ];
    
    return baseColumns;
  }, [isMobile, isTablet, airportDataLoaded, formatCityDisplay]);

  // Combined function to fetch trips and ensure airport data is loaded
  const fetchPreviousTrips = async (page: number, pageSize: number) => {
    setLoadingPreviousTrips(true);
    try {
      const client = generateClient<Schema>();
      const today = new Date().toISOString().split('T')[0];
      
      // Start trips API call
      const tripsPromise = client.models.Trips.list({ 
        limit: pageSize, 
        nextToken: previousTripsPageTokens[page],
        filter: {
          flightDate: { lt: today }
        }
      });
      
      // Check if we need to load airport data in parallel
      let airportsPromise: Promise<Schema["Airports"]["type"][]> = Promise.resolve([]);
      if (!airportDataLoaded && airportData.length === 0) {
        const cachedAirports = localStorage.getItem('airportData');
        if (!cachedAirports) {
          airportsPromise = loadAirportsData(client);
        }
      }
      
      // Wait for both API calls to complete
      const [result, airportsResult] = await Promise.all([tripsPromise, airportsPromise]);
      
      // Update airport data if we fetched it
      if (airportsResult.length > 0) {
        setAirportData(airportsResult);
        setAirportDataLoaded(true);
        localStorage.setItem('airportData', JSON.stringify(airportsResult));
      }
      
      const tripsData = (result.data || []).map((trip: any) => ({
        id: trip.tripId,
        tripId: trip.tripId,
        from: trip.fromCity, // Raw airport code for processing in cell renderer
        to: trip.toCity, // Raw airport code for processing in cell renderer
        layover: Array.isArray(trip.layoverCity) ? trip.layoverCity.join(', ') : trip.layoverCity || '', // Keep unchanged as required
        date: formatDateToDDMONYYYY(trip.flightDate),
        time: trip.flightTime ? trip.flightTime.slice(0,5) + 'H' : '',
        booked: trip.confirmed ? 'Y' : 'N',
        flight: trip.flightDetails || '',
        languagePreference: Array.isArray(trip.languagePreferences) ? trip.languagePreferences.join(', ') : trip.languagePreferences || '',
      }));

      // Sort data client-side by date in descending order
      const sortedTrips = [...tripsData].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setPreviousTrips(sortedTrips);
      setFilteredPreviousTrips(sortedTrips);
      
      const newPageTokens = [...previousTripsPageTokens];
      newPageTokens[page + 1] = result.nextToken || undefined;
      setPreviousTripsPageTokens(newPageTokens);
      
      if (result.nextToken) {
        setPreviousTripsRowCount((page + 1) * pageSize + 1);
      } else {
        setPreviousTripsRowCount((page * pageSize) + tripsData.length);
      }
    } catch (err) {
      console.error('Error fetching previous trips:', err);
      setPreviousTrips([]);
      setFilteredPreviousTrips([]);
    } finally {
      setLoadingPreviousTrips(false);
    }
  };
  
  // Helper function to load airports data
  const loadAirportsData = async (client: any): Promise<Schema["Airports"]["type"][]> => {
    try {
      let allAirports: Schema["Airports"]["type"][] = [];
      let nextToken: string | null | undefined = undefined;
      
      do {
        const response: any = await client.models.Airports.list({
          limit: 1000,
          nextToken: nextToken || undefined
        });
        
        if (response.data) {
          allAirports = allAirports.concat(response.data);
        }
        
        nextToken = response.nextToken || undefined;
      } while (nextToken);
      
      return allAirports;
    } catch (error) {
      console.error('Error loading airports data:', error);
      return [];
    }
  };

  // Function to handle opening the comment modal
  const handleOpenCommentModal = (rowData: any) => {
    if (!isSignedIn || !userEmail) {
      setSuccessMessage('⚠️ Please sign in or register first to add a comment');
      return;
    }
    setSelectedRowData(rowData);
    setOpenCommentModal(true);
  };

  // Function to handle cell click
  const handleCellClick = (params: GridCellParams) => {
    if (params.field === 'actions') {
      // Handle comment icon click (since view icon has its own onClick handler)
      handleOpenCommentModal(params.row);
    }
  };

  // Handle pagination model change
  const handlePaginationModelChange = (newModel: { page: number; pageSize: number }) => {
    if (newModel.pageSize !== paginationModel.pageSize) {
      setPreviousTripsPageTokens([undefined]);
      newModel.page = 0;
    }
    setPaginationModel(newModel);
  };

  // Search functionality
  React.useEffect(() => {
    const performPreviousTripsSearch = async () => {
      if (!debouncedSearch) {
        setFilteredPreviousTrips(previousTrips);
        return;
      }

      setSearchLoading(true);
      try {
        const client = generateClient<Schema>();
        const today = new Date().toISOString().split('T')[0];
        
        const result = await client.models.Trips.list({
          filter: {
            and: [
              {
                or: [
                  { fromCity: { contains: debouncedSearch } },
                  { toCity: { contains: debouncedSearch } },
                  { flightDetails: { contains: debouncedSearch } },
                  { layoverCity: { contains: debouncedSearch } }
                ]
              },
              { flightDate: { lt: today } }
            ]
          },
          limit: 100
        });

        const searchResults = (result.data || []).map((trip: any) => ({
          id: trip.tripId,
          tripId: trip.tripId,
          from: trip.fromCity, // Raw airport code for processing in cell renderer
          to: trip.toCity, // Raw airport code for processing in cell renderer
          layover: Array.isArray(trip.layoverCity) ? trip.layoverCity.join(', ') : trip.layoverCity || '', // Keep unchanged as required
          date: formatDateToDDMONYYYY(trip.flightDate),
          time: trip.flightTime ? trip.flightTime.slice(0,5) + 'H' : '',
          booked: trip.confirmed ? 'Y' : 'N',
          flight: trip.flightDetails || '',
          languagePreference: Array.isArray(trip.languagePreferences) ? trip.languagePreferences.join(', ') : trip.languagePreferences || '',
        }));

        // Sort search results by date in descending order
        const sortedResults = [...searchResults].sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        setFilteredPreviousTrips(sortedResults);
        setPreviousTripsRowCount(sortedResults.length);
      } catch (error) {
        console.error('Error performing search:', error);
        setFilteredPreviousTrips([]);
        setPreviousTripsRowCount(0);
      } finally {
        setSearchLoading(false);
      }
    };

    performPreviousTripsSearch();
  }, [debouncedSearch]);

  // Fetch previous trips when page or pageSize changes
  React.useEffect(() => {
    fetchPreviousTrips(paginationModel.page, paginationModel.pageSize);
  }, [paginationModel.page, paginationModel.pageSize]);

  // Function to handle closing the comment modal
  const handleCloseCommentModal = () => {
    setOpenCommentModal(false);
    setSelectedRowData(null);
  };
  
  // Function to handle comment submission
  const handleCommentSubmit = async (comment: string) => {
    if (selectedRowData) {
      try {
        const username = localStorage.getItem('username') || 'anonymous';
        
        const client = generateClient<Schema>();
        const now = new Date().toISOString();
        const commentInput = {
          commentId: `COMMENT#${Date.now()}`,
          tripId: selectedRowData.id,
          userEmail: userEmail || 'anonymous',
          commentText: comment,
          createdAt: now,
          updatedAt: now,
          editable: true,
          created_by: username,
        };
        
        // Create the comment
        await client.models.Comments.create(commentInput);
        setSuccessMessage('Comment added successfully!');

        // Try to send email notification
        try {
          const emailForNotification = userEmail || 'anonymous@example.com';
          const apiClient = generateClient<Schema>();
          await apiClient.graphql({
            query: sendCommentEmail,
            variables: {
              email: emailForNotification,
              subject: 'New Comment Added',
              message: comment
            }
          });
          console.log('Email notification sent!');
        } catch (emailError) {
          console.error('Error sending email notification:', emailError);
          // Don't show error to user since comment was saved successfully
        }

        handleCloseCommentModal();
      } catch (error: any) {
        setSuccessMessage('Error saving comment: ' + (error.message || 'Unknown error'));
      }
    }
  };

  return (
    <Box sx={{ 
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: { xs: 2, sm: 3 },
      p: 0
    }}>
      {/* Enhanced Search Section */}
      <Box sx={{ 
        display: 'flex',
        justifyContent: 'center',
        mb: { xs: 2, md: 2.5 }
      }}>
        <Paper
          elevation={0}
          sx={{
            width: { xs: '100%', sm: '80%', md: '60%', lg: '50%' },
            maxWidth: '600px',
            borderRadius: '20px',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(245, 158, 11, 0.1)',
            transition: 'all 0.3s ease',
            '&:hover': {
              boxShadow: '0 12px 40px rgba(245, 158, 11, 0.15)',
              transform: 'translateY(-2px)',
            }
          }}
        >
          <TextField
            variant="outlined"
            placeholder="Search destinations, travelers, or trip details..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            fullWidth
            sx={{ 
              '& .MuiOutlinedInput-root': {
                borderRadius: '20px',
                border: 'none',
                fontSize: '1.1rem',
                padding: '4px 8px',
                '& fieldset': {
                  border: 'none',
                },
                '&:hover fieldset': {
                  border: 'none',
                },
                '&.Mui-focused fieldset': {
                  border: 'none',
                },
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#f59e0b', fontSize: 24 }} />
                </InputAdornment>
              ),
              endAdornment: searchLoading && (
                <InputAdornment position="end">
                  <CircularProgress size={24} sx={{ color: '#f59e0b' }} />
                </InputAdornment>
              )
            }}
          />
        </Paper>
      </Box>
      {/* Section Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'flex-start',
        alignItems: 'center',
        mb: { xs: 2, sm: 2.5 },
        textAlign: 'left'
      }}>
        <Typography 
          variant="h3"
          component="h1" 
          sx={{ 
            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.25rem' },
            fontWeight: 700,
            background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Travel History
        </Typography>
      </Box>

      {/* Modern Data Grid Section */}
      <Paper 
        elevation={0}
        sx={{ 
          borderRadius: '24px',
          border: '1px solid rgba(245, 158, 11, 0.15)',
          background: 'linear-gradient(135deg, #ffffff 0%, #fefefe 100%)',
          overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(245, 158, 11, 0.08)',
          mb: { xs: 3, sm: 4 },
          position: 'relative',
          zIndex: 1,
          width: '100%',
          minHeight: '500px',
          display: 'flex',
          alignItems: loadingPreviousTrips ? 'center' : 'flex-start',
          justifyContent: loadingPreviousTrips ? 'center' : 'flex-start',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: 'linear-gradient(90deg, #f59e0b, #d97706, #f59e0b)',
            zIndex: 1,
          },
        }}
      >
        {loadingPreviousTrips ? (
          <CircularProgress size={48} sx={{ mx: 'auto', my: 8 }} />
        ) : (
          <DataGrid
            rows={filteredPreviousTrips}
            columns={responsiveColumns}
            pageSizeOptions={[100, 150]}
            paginationModel={paginationModel}
            onPaginationModelChange={handlePaginationModelChange}
            rowCount={previousTripsRowCount}
            paginationMode={debouncedSearch ? "client" : "server"}
            disableRowSelectionOnClick
            autoHeight
            onCellClick={handleCellClick}
            columnVisibilityModel={columnVisibilityModel}
            onColumnVisibilityModelChange={(newModel) => {
              setColumnVisibilityModel({
                layover: newModel.layover ?? true,
                time: newModel.time ?? true,
                flight: newModel.flight ?? true
              });
            }}
            sx={{
              border: 'none',
              width: '100%',
              minHeight: '400px',
              overflow: 'visible !important',
              '.MuiDataGrid-main': {
                overflow: 'visible !important',
                width: '100%',
              },
              '.MuiDataGrid-virtualScroller': {
                overflow: 'visible !important',
              },
              '.MuiDataGrid-columnHeader': {
                backgroundColor: 'rgb(26, 150, 152) !important',
                color: 'white !important',
                fontWeight: '800 !important',
                fontSize: isMobile ? '0.8rem !important' : '0.9rem !important',
                textTransform: 'uppercase !important',
                letterSpacing: '0.5px !important',
                padding: isMobile ? '0 4px !important' : '0 8px !important',
              },
              '.MuiDataGrid-columnHeaderTitle': {
                fontWeight: '800 !important',
                color: 'white !important',
              },
              '.MuiDataGrid-columnHeaderTitleContainer': {
                padding: '0 8px',
              },
              '.MuiDataGrid-columnHeaderFilterIconButton': {
                color: 'white !important',
              },
              '.MuiDataGrid-menuIcon': {
                color: 'white !important',
              },
              '.MuiDataGrid-sortIcon': {
                color: 'white !important',
              },
              '.MuiDataGrid-cell': {
                borderBottom: '1px solid #f0f0f0',
                fontSize: isMobile ? '0.8rem' : '0.85rem',
                padding: isMobile ? '6px 4px' : '6px 16px',
                whiteSpace: 'normal',
                wordWrap: 'break-word',
              },
              '.MuiDataGrid-row:hover': {
                backgroundColor: '#f5f5f5',
              },
              '.MuiDataGrid-footerContainer': {
                borderTop: 'none',
                backgroundColor: 'white',
              },
              '.MuiTablePagination-root': {
                color: '#37474f',
              },
            }}
            density={isMobile ? "compact" : "standard"}
          />
        )}
      </Paper>

      {/* Comment Modal */}
      <CommentModal
        open={openCommentModal}
        onClose={handleCloseCommentModal}
        onSubmit={handleCommentSubmit}
        rowData={selectedRowData}
      />
      
      {/* Snackbar for success/error messages */}
      <Snackbar
        open={successMessage !== null}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSuccessMessage(null)} 
          severity={successMessage?.includes('⚠️') ? 'error' : 'success'}
          sx={{
            width: '100%',
            backgroundColor: successMessage?.includes('⚠️') ? '#ffebee' : undefined,
            '& .MuiAlert-icon': {
              color: successMessage?.includes('⚠️') ? '#d32f2f' : undefined,
            },
            '& .MuiAlert-message': {
              color: successMessage?.includes('⚠️') ? '#d32f2f' : undefined,
              fontWeight: successMessage?.includes('⚠️') ? 'bold' : undefined,
            }
          }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
} 