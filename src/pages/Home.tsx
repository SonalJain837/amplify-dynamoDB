import * as React from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { 
  Box, 
  Typography, 
  TextField, 
  Paper, 
  InputAdornment,
  useMediaQuery,
  useTheme,
  Button,
  createTheme,
  ThemeProvider,
  CssBaseline,
  GlobalStyles,
  Tooltip,
  Snackbar,
  Alert
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import Header from '../components/Header';
import { Amplify } from 'aws-amplify';
// Ensure the amplify_outputs.json is correctly imported
// If the import fails, you need to run 'npx ampx sandbox' to generate it 
import amplifyconfig from '../../amplify_outputs.json';
import AddTripModal from '../components/AddTripModal';
import CommentModal from '../components/CommentModal';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser } from 'aws-amplify/auth';
import { type Schema } from '../../amplify/data/resource';
import CircularProgress from '@mui/material/CircularProgress';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import { useDebounce } from 'use-debounce';
import { sendCommentEmail } from '../graphql/mutations';

const filterFutureTrips = (trips: any[]) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return trips.filter(trip => {
    if (!trip.date) return false;
    // Robust date parsing to avoid timezone issues
    const [year, month, day] = trip.date.split('-').map(Number);
    const flightDate = new Date(year, month - 1, day);
    return flightDate >= today;
  });
};

// Force direct styling of headers with CSS
const headerStyles = `
  .MuiDataGrid-columnHeader {
    background-color: rgb(26, 150, 152) !important;
    color: white !important;
    font-weight: 800 !important;
    text-transform: uppercase !important;
  }
  .MuiDataGrid-columnHeaderTitle {
    color: white !important;
    font-weight: 800 !important;
  }
  .MuiDataGrid-columnHeaders {
    background-color: rgb(26, 150, 152) !important;
  }
  .MuiDataGrid-columnHeaderDraggableContainer {
    background-color: rgb(26, 150, 152) !important;
  }
  .MuiDataGrid-menuIcon svg {
    color: white !important;
  }
  .MuiDataGrid-iconButtonContainer svg {
    color: white !important;
  }
  .MuiDataGrid-sortIcon {
    color: white !important;
  }
`;

// Configure Amplify with the generated outputs
try {
  Amplify.configure(amplifyconfig);
} catch (error) {
  console.error('Error configuring Amplify:', error);
}

// Create a custom theme for consistent styling
const theme = createTheme({
  palette: {
    primary: {
      main: 'rgb(26, 150, 152)',
    },
    background: {
      default: '#f5f8fa',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
});

// Create responsive columns using hooks
export default function Home() {
  const [search, setSearch] = React.useState('');
  const [debouncedSearch] = useDebounce(search, 300);
  const [filteredRows, setFilteredRows] = React.useState<any[]>([]);
  const [loadingTrips, setLoadingTrips] = React.useState(true);
  const [trips, setTrips] = React.useState<any[]>([]);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const customTheme = useTheme();
  const isMobile = useMediaQuery(customTheme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(customTheme.breakpoints.down('md'));
  const isLargeScreen = useMediaQuery(customTheme.breakpoints.up('lg'));
  const navigate = useNavigate();
  const [airportData, setAirportData] = React.useState<Schema["Airports"]["type"][]>([]);
  
  // Add state for column visibility
  const [columnVisibilityModel, setColumnVisibilityModel] = React.useState({
    layover: !isMobile,
    time: !(isMobile && !isLargeScreen),
    flight: !(isMobile && !isLargeScreen && window.innerWidth < 400)
  });
  
  // Handle column visibility model change
  const handleColumnVisibilityModelChange = (newModel: any) => {
    setColumnVisibilityModel(newModel);
  };
  
  // Generate columns based on screen size
  const responsiveColumns = React.useMemo(() => {
    // Define column visibility based on screen size
    const showLayover = !isMobile;
    const showTime = !(isMobile && !isLargeScreen);
    const showFlight = !(isMobile && !isLargeScreen && window.innerWidth < 400);
    
    const baseColumns: GridColDef[] = [
      { 
        field: 'from', 
        headerName: 'From City', 
        flex: isMobile ? 1 : 0.8, 
        minWidth: isMobile ? 70 : 90,
        headerAlign: 'left',
        align: 'left',
        headerClassName: 'super-app-theme--header',
      },
      { 
        field: 'to', 
        headerName: 'To City', 
        flex: isMobile ? 1 : 0.8, 
        minWidth: isMobile ? 70 : 90,
        headerAlign: 'left',
        align: 'left',
        headerClassName: 'super-app-theme--header',
      },
      { 
        field: 'layover', 
        headerName: 'Layover', 
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
      },
      {
        field: 'comment',
        headerName: 'Comment',
        flex: 0.6,
        minWidth: 60,
        maxWidth: 80,
        sortable: false,
        filterable: false,
        headerClassName: 'super-app-theme--header',
        renderCell: (cellParams) => {
          return (
            <Tooltip title="Add a comment">
              <Box 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  width: '100%' 
                }}
              >
                <ChatBubbleOutlineIcon 
                  sx={{ color: '#FF8C00', fontSize: isMobile ? 20 : 24, cursor: 'pointer' }} 
                />
              </Box>
            </Tooltip>
          );
        },
      },
      {
        field: 'view',
        headerName: 'View',
        flex: 0.6,
        minWidth: 60,
        maxWidth: 80,
        sortable: false,
        filterable: false,
        headerClassName: 'super-app-theme--header',
        renderCell: (cellParams) => {
          return (
            <Tooltip title="View comments">
              <Box 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  width: '100%' 
                }}
              >
                <VisibilityIcon 
                  sx={{ color: '#1A9698', fontSize: isMobile ? 20 : 24, cursor: 'pointer' }} 
                />
              </Box>
            </Tooltip>
          );
        },
      },
    ];
    
    return baseColumns;
  }, [isMobile, isTablet, isLargeScreen, navigate]);
  
  // Modal states
  const [openAddTripModal, setOpenAddTripModal] = React.useState(false);
  const [openCommentModal, setOpenCommentModal] = React.useState(false);
  const [selectedRowData, setSelectedRowData] = React.useState<any>(null);

  // Handle opening the Add Trip modal
  const handleOpenAddTripModal = async () => {
    try {
      // Check if user is authenticated
      const { username } = await getCurrentUser();
      if (!username) {
        // Show authentication required message
        setSuccessMessage('⚠️ Please sign in or register first to add a trip');
        return;
      }
      // If authenticated, open the modal
    setOpenAddTripModal(true);
    } catch (error) {
      // Show authentication required message
      setSuccessMessage('⚠️ Please sign in or register first to add a trip');
    }
  };
  
  // Handle closing the Add Trip modal
  const handleCloseAddTripModal = () => {
    setOpenAddTripModal(false);
  };
  
  // State for pagination
  const [paginationModel, setPaginationModel] = React.useState({ pageSize: 100, page: 0 });
  const [pageTokens, setPageTokens] = React.useState<(string | undefined)[]>([undefined]);
  const [rowCount, setRowCount] = React.useState<number>(0);

  // Handle pagination model change
  const handlePaginationModelChange = (newModel: any) => {
    // If page size changes, reset to first page
    if (newModel.pageSize !== paginationModel.pageSize) {
      setPageTokens([undefined]);
      newModel.page = 0;
    }
    setPaginationModel(newModel);
  };

  // Function to fetch trips from DynamoDB with pagination
  const fetchTrips = async (page: number, pageSize: number) => {
    setLoadingTrips(true);
    try {
      const client = generateClient<Schema>();
      const today = new Date().toISOString().split('T')[0];
      
      const result: any = await client.models.Trips.list({ 
        limit: pageSize, 
        nextToken: pageTokens[page],
        filter: {
          flightDate: { ge: today }
        }
      });
      
      const tripsData = (result.data || []).map((trip: any) => ({
        id: trip.tripId,
        tripId: trip.tripId,
        from: trip.fromCity,
        to: trip.toCity,
        layover: Array.isArray(trip.layoverCity) ? trip.layoverCity.join(', ') : trip.layoverCity || '',
        date: trip.flightDate,
        time: trip.flightTime ? trip.flightTime.slice(0,5) + 'H' : '',
        booked: trip.confirmed ? 'Y' : 'N',
        flight: trip.flightDetails || '',
      }));

      // Sort data client-side by date
      const sortedTrips = [...tripsData].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      const futureTrips = filterFutureTrips(sortedTrips);

      setTrips(futureTrips);
      setFilteredRows(futureTrips);
      
      const newPageTokens = [...pageTokens];
      newPageTokens[page + 1] = result.nextToken;
      setPageTokens(newPageTokens);
      
      if (result.nextToken) {
        setRowCount((page + 1) * pageSize + 1);
      } else {
        setRowCount((page * pageSize) + tripsData.length);
      }
    } catch (err) {
      console.error('Error fetching trips:', err);
      setTrips([]);
      setFilteredRows([]);
    } finally {
      setLoadingTrips(false);
    }
  };

  // Fetch trips when page or pageSize changes
  React.useEffect(() => {
    fetchTrips(paginationModel.page, paginationModel.pageSize);
    // eslint-disable-next-line
  }, [paginationModel.page, paginationModel.pageSize]);

  // Remove allTrips state and related code
  const [searchLoading, setSearchLoading] = React.useState(false);

  // Optimize search for large datasets
  React.useEffect(() => {
    const performSearch = async () => {
      if (!debouncedSearch) {
        setFilteredRows(trips);
        setPaginationModel({ pageSize: 100, page: 0 });
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
              { flightDate: { ge: today } }
            ]
          },
          limit: 100 // Reduced limit for better performance
        });

        const searchResults = (result.data || []).map((trip: any) => ({
          id: trip.tripId,
          tripId: trip.tripId,
          from: trip.fromCity,
          to: trip.toCity,
          layover: Array.isArray(trip.layoverCity) ? trip.layoverCity.join(', ') : trip.layoverCity || '',
          date: trip.flightDate,
          time: trip.flightTime ? trip.flightTime.slice(0,5) + 'H' : '',
          booked: trip.confirmed ? 'Y' : 'N',
          flight: trip.flightDetails || '',
        }));

        // Sort search results by date
        const sortedResults = [...searchResults].sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        const futureResults = filterFutureTrips(sortedResults);
  
        setFilteredRows(futureResults);
        setPaginationModel({ pageSize: 100, page: 0 });
        setRowCount(futureResults.length);
      } catch (error) {
        console.error('Error performing search:', error);
        setFilteredRows([]);
        setRowCount(0);
      } finally {
        setSearchLoading(false);
      }
    };

    performSearch();
  }, [debouncedSearch]);

  // Update handleAddTripSubmit to handle ID generation
  const handleAddTripSubmit = async (tripData: any) => {
    try {
      // Get current user's email
      const { username } = await getCurrentUser();
      if (!username) {
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

      // Generate a unique tripId if not present
      const tripId = tripData.tripId || `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

      // Create new trip in DynamoDB
      const client = generateClient<Schema>();
      const tripInput: any = {
        tripId,
        userEmail: username,
        fromCity: tripData.fromCity,
        toCity: tripData.toCity,
        confirmed: tripData.isBooked,
        flightDate: tripData.flightDate,
        createdAt: new Date().toISOString()
      };
      if (tripData.layoverCity && tripData.layoverCity.trim() !== '') {
        tripInput.layoverCity = [tripData.layoverCity];
      }
      if (tripData.flightTime && tripData.flightTime.trim() !== '') {
        // Ensure flightTime is in HH:mm:ss format
        tripInput.flightTime = /^\d{2}:\d{2}$/.test(tripData.flightTime)
          ? tripData.flightTime + ':00'
          : tripData.flightTime;
      }
      if (tripData.flightDetails && tripData.flightDetails.trim() !== '') {
        tripInput.flightDetails = tripData.flightDetails;
      }
      const createdTrip = await client.models.Trips.create(tripInput);
      if (createdTrip.data) {
        const newTrip = {
          id: createdTrip.data.tripId,
          tripId: createdTrip.data.tripId,
          from: createdTrip.data.fromCity,
          to: createdTrip.data.toCity,
          layover: Array.isArray(createdTrip.data.layoverCity) ? createdTrip.data.layoverCity.join(', ') : createdTrip.data.layoverCity || '',
          date: createdTrip.data.flightDate,
          time: createdTrip.data.flightTime ? createdTrip.data.flightTime.slice(0,5) + 'H' : '',
          booked: createdTrip.data.confirmed ? 'Y' : 'N',
          flight: createdTrip.data.flightDetails || '',
        };
        // Update both current page trips and all trips
        setTrips(prev => [newTrip, ...prev]);
        setFilteredRows(prev => [newTrip, ...prev]);
      }
      setSuccessMessage(`Trip from ${tripData.fromCity} to ${tripData.toCity} added successfully!`);
      handleCloseAddTripModal();
    } catch (dbError: any) {
      setSuccessMessage('Something went wrong. Please try again.');
    }
  };

  // Function to handle opening the comment modal
  const handleOpenCommentModal = async (rowData: any) => {
    try {
      const { username } = await getCurrentUser();
      if (!username) {
        setSuccessMessage('⚠️ Please sign in or register first to add a comment');
        return;
      }
    setSelectedRowData(rowData);
    setOpenCommentModal(true);
    } catch (error) {
      setSuccessMessage('⚠️ Please sign in or register first to add a comment');
    }
  };
  
  // Function to handle closing the comment modal
  const handleCloseCommentModal = () => {
    setOpenCommentModal(false);
    setSelectedRowData(null);
  };
  
  // Function to handle comment submission
  const handleCommentSubmit = async (comment: string) => {
    if (selectedRowData) {
      try {
        const user = await getCurrentUser().catch(() => null);
        const email = user?.signInDetails?.loginId || user?.username;
        const username = localStorage.getItem('username');
        
        const client = generateClient<Schema>();
        const now = new Date().toISOString();
        const commentInput = {
          commentId: `COMMENT#${Date.now()}`,
          tripId: selectedRowData.id,
          userEmail: email || 'anonymous',
          commentText: comment,
          createdAt: now,
          updatedAt: now,
          editable: true,
          created_by: username || 'anonymous',
        };
        
        // First create the comment
        await client.models.Comments.create(commentInput);
        setSuccessMessage('Comment added successfully!');

        // Then try to send the email using the API client
        try {
          const apiClient = generateClient<Schema>();
          await apiClient.graphql({
            query: sendCommentEmail,
            variables: {
              email: email || 'anonymous@example.com',
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

  // Cache trips in localStorage
  React.useEffect(() => {
    if (trips.length > 0) {
      localStorage.setItem('cachedTrips', JSON.stringify(trips));
    }
  }, [trips]);

  // Load cached trips on mount
  React.useEffect(() => {
    const cached = localStorage.getItem('cachedTrips');
    if (cached) {
      const parsed = JSON.parse(cached);
      setTrips(parsed);
      setFilteredRows(parsed);
    }
  }, []);

  // Function to handle cell click events
  const handleCellClick = (cellParams: any) => {
    if (cellParams.field === 'comment') {
      handleOpenCommentModal(cellParams.row);
    } else if (cellParams.field === 'view') {
      const tripId = cellParams.row.tripId || cellParams.row.id;
      if (!tripId) {
        setSuccessMessage('⚠️ Unable to view comments: Trip ID not found');
        return;
      }
      navigate(`/trip-comments/${tripId}`);
    }
  };

  React.useEffect(() => {
    const client = generateClient<Schema>();
    const fetchAirportData = async () => {
      try {
        const { data: airports } = await client.models.Airports.list();
        if (airports) {
          setAirportData(airports);
          localStorage.setItem('airportData', JSON.stringify(airports));
        }
      } catch (error) {
        console.error("Error fetching airport data:", error);
      }
    };
    fetchAirportData();
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* Inject direct CSS for header styling */}
      <style dangerouslySetInnerHTML={{ __html: headerStyles }} />
      <GlobalStyles
        styles={{
          '.MuiMenu-paper': {
            backgroundColor: 'white !important',
            color: '#333 !important',
          },
          '.MuiMenuItem-root': {
            color: '#333 !important',
            backgroundColor: 'white !important',
          },
          '.MuiMenuItem-root:hover': {
            backgroundColor: '#f0f5ff !important',
          },
          '.MuiDataGrid-columnHeader': {
            backgroundColor: 'rgb(26, 150, 152) !important',
            color: 'white !important',
            fontWeight: '800 !important',
          },
          '.MuiDataGrid-columnHeaderTitle': {
            fontWeight: '800 !important',
            color: 'white !important',
          },
          '.MuiDataGrid-columnHeaders': {
            backgroundColor: 'rgb(26, 150, 152) !important',
            color: 'white !important',
          },
          '.hidden-column': {
            display: 'none !important',
          },
          '.MuiDataGrid-panel': {
            backgroundColor: 'white !important',
            color: '#333 !important',
          },
          '.MuiDataGrid-filterForm': {
            backgroundColor: 'white !important',
          },
          '.MuiSelect-select': {
            backgroundColor: 'white !important',
            color: '#333 !important',
          },
          '.MuiPopover-paper': {
            backgroundColor: 'white !important',
          },
          '.MuiDataGrid-panelContent': {
            backgroundColor: 'white !important',
            color: '#333 !important',
          },
          '.MuiDataGrid-panelFooter': {
            backgroundColor: 'white !important',
          },
          '.MuiDataGrid-filterFormValueInput': {
            backgroundColor: 'white !important',
            color: '#333 !important',
          },
          'body': {
            overflow: 'auto !important',
          },
          '.MuiBox-root': {
            boxSizing: 'border-box',
          },
        }}
      />
      <Box 
        sx={{ 
          width: '100%',
          height: 'auto',
          minHeight: '100vh',
          bgcolor: '#f5f8fa',
          padding: 0,
          margin: 0,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'visible',
        }}
      >
        {/* Using the reusable Header component */}
        <Header />

        {/* Main content area with normal spacing */}
        <Box component="main"
          sx={{
            width: '100%',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: { xs: 2, sm: 3 },
            position: 'static',
            overflow: 'visible',
          }}
        >
          {/* Centered Search Field - always visible and stable */}
          <Box sx={{ 
            width: '100%',
            py: { xs: 2, sm: 3 },
            mb: { xs: 2, sm: 3 },
            display: 'flex',
            justifyContent: 'center',
            position: 'static',
            zIndex: 2,
          }}>
            <TextField
              variant="outlined"
              placeholder="Search Travel Details..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              sx={{ 
                width: { xs: '90%', sm: '60%', md: '50%', lg: '40%' },
                bgcolor: 'white', 
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                }
              }}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: searchLoading && (
                  <InputAdornment position="end">
                    <CircularProgress size={20} />
                  </InputAdornment>
                )
              }}
            />
          </Box>

          {/* Title and Add Trip Button */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            width: '100%',
            px: { xs: 1, sm: 2 },
            mb: { xs: 2, sm: 3 },
            position: 'static',
            zIndex: 1,
          }}>
            <Typography 
              variant={isMobile ? "h5" : (isTablet ? "h4" : "h4")}
              component="h1" 
              sx={{ 
                color: '#2c3e50',
                fontWeight: 600,
                fontSize: { xs: '1.25rem', sm: '1.75rem', md: '2rem' }
              }}
            >
              Travel Details
            </Typography>
            
            <Button
              variant="contained"
              startIcon={
                <Box component="span" 
                  sx={{ 
                    width: 18, 
                    height: 18, 
                    borderRadius: '50%', 
                    bgcolor: 'rgb(26, 150, 152)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    mr: 0.5,
                  }}
                >
                  +
                </Box>
              }
              sx={{
                bgcolor: '#f0f0f0',
                color: '#333',
                textTransform: 'none',
                fontWeight: 'medium',
                px: 2,
                py: 0.5,
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                borderRadius: 1,
                border: '1px solid #e0e0e0',
                '&:hover': {
                  bgcolor: '#e6eef5',
                },
              }}
              onClick={handleOpenAddTripModal}
            >
              Add a Trip
            </Button>
          </Box>

          {/* Data Grid Section - improved responsiveness */}
          <Box sx={{ 
            width: '100%', 
            maxWidth: '100%',
            px: { xs: 1, sm: 2, md: 3 },
            mx: 'auto',
            mb: { xs: 4, sm: 5 },
            position: 'static',
            overflow: 'visible',
            zIndex: 1,
          }}>
            <Paper 
              elevation={3}
              sx={{ 
                borderRadius: 2,
                overflow: 'visible',
                boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                mb: { xs: 3, sm: 4 },
                position: 'relative',
                zIndex: 1,
                width: '100%',
                minHeight: '400px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: loadingTrips ? 'center' : 'flex-start',
              }}
            >
              {loadingTrips ? (
                <CircularProgress size={48} sx={{ mx: 'auto', my: 8 }} />
              ) : (
                <DataGrid
                  rows={filteredRows}
                  columns={responsiveColumns}
                  pageSizeOptions={[100, 150]}
                  paginationModel={paginationModel}
                  onPaginationModelChange={handlePaginationModelChange}
                  rowCount={rowCount}
                  paginationMode={debouncedSearch ? "client" : "server"}
                  disableRowSelectionOnClick
                  autoHeight
                  checkboxSelection={false}
                  columnVisibilityModel={columnVisibilityModel}
                  onColumnVisibilityModelChange={handleColumnVisibilityModelChange}
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
                    '.MuiDataGrid-menuList': {
                      backgroundColor: 'white !important',
                      color: '#333 !important',
                    },
                    '.MuiDataGrid-panelContent': {
                      backgroundColor: 'white !important',
                      color: '#333 !important',
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
                    '.MuiTablePagination-select': {
                      color: '#333 !important',
                      backgroundColor: 'white !important',
                    },
                    '.MuiTablePagination-selectIcon': {
                      color: '#333 !important',
                    },
                    '.MuiTablePagination-menuItem': {
                      color: '#333 !important',
                      backgroundColor: 'white !important',
                    },
                  }}
                  hideFooterSelectedRowCount
                  density={isMobile ? "compact" : "standard"}
                  onCellClick={handleCellClick}
                />
              )}
            </Paper>
          </Box>
        </Box>
      </Box>

      {/* Add Trip Modal */}
      <AddTripModal 
        open={openAddTripModal}
        onClose={handleCloseAddTripModal}
        onSubmit={handleAddTripSubmit}
        airportData={airportData}
      />
      
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
      <Footer />
    </ThemeProvider>
  );
} 
