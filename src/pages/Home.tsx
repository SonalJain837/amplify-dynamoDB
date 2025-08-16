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
import PersonIcon from '@mui/icons-material/Person';
import MessageIcon from '@mui/icons-material/Message';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import SendIcon from '@mui/icons-material/Send';
import Header from '../components/Header';
import { Amplify } from 'aws-amplify';
// Ensure the amplify_outputs.json is correctly imported
// If the import fails, you need to run 'npx ampx sandbox' to generate it 
import amplifyconfig from '../../amplify_outputs.json';
import AddTripModal from '../components/AddTripModal';
import CommentModal from '../components/CommentModal';
import { Dialog, DialogTitle, DialogContent, DialogActions, Avatar, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { generateClient } from 'aws-amplify/api';
import { useUser } from '../contexts/UserContext';
import { type Schema } from '../../amplify/data/resource';
import CircularProgress from '@mui/material/CircularProgress';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import { useDebounce } from 'use-debounce';
import { sendCommentEmail } from '../graphql/mutations';
import appConfig from '../../app.config.json';
import { formatDateToDDMONYYYY } from '../utils/dateUtils';
import { dateFormatter } from '../utils/dateFormatter';
import { AmplifyMessagingService } from '../services/amplifyMessagingService';
import TravelChatModal from '../components/TravelChatModal';

// The filtering is now done server-side in the query for better performance

// Memoized data transformation to avoid repeated processing
const transformTripData = (trips: any[]) => {
  return trips.map((trip: any) => ({
    id: trip.tripId,
    tripId: trip.tripId,
    from: trip.fromCity,
    to: trip.toCity,
    layover: Array.isArray(trip.layoverCity) ? trip.layoverCity.join(', ') : trip.layoverCity || '',
    date: formatDateToDDMONYYYY(trip.flightDate),
    time: trip.flightTime ? trip.flightTime.slice(0,5) + 'H' : '',
    booked: trip.confirmed ? 'Y' : 'N',
    flight: trip.flightDetails || '',
    languagePreference: Array.isArray(trip.languagePreferences) ? trip.languagePreferences.join(', ') : trip.languagePreferences || '',
    userEmail: trip.userEmail || '',
    ownerName: trip.userEmail ? trip.userEmail.split('@')[0] : 'Unknown User',
  }));
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
      default: '#ffffff',
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

// Memoized DataGrid component to prevent unnecessary re-renders
const OptimizedDataGrid = React.memo(({ 
  rows, 
  columns, 
  loading, 
  paginationModel, 
  onPaginationModelChange, 
  rowCount, 
  paginationMode, 
  columnVisibilityModel, 
  onColumnVisibilityModelChange, 
  onCellClick, 
  isMobile 
}: any) => (
  <DataGrid
    rows={rows}
    columns={columns}
    pageSizeOptions={[25, 50, 100]}
    paginationModel={paginationModel}
    onPaginationModelChange={onPaginationModelChange}
    rowCount={rowCount}
    paginationMode={paginationMode}
    disableRowSelectionOnClick
    autoHeight
    checkboxSelection={false}
    columnVisibilityModel={columnVisibilityModel}
    onColumnVisibilityModelChange={onColumnVisibilityModelChange}
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
    onCellClick={onCellClick}
  />
));

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
  
  // Use shared user context
  const { userData } = useUser();
  const { isSignedIn, userEmail } = userData;
  
  // Add state to force re-render when airport data loads
  const [airportDataLoaded, setAirportDataLoaded] = React.useState(false);
  
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
  
  // Memoized columns based on screen size
  const responsiveColumns = React.useMemo(() => {
    // Define column visibility based on screen size
    const showLayover = !isMobile;
    const showTime = !(isMobile && !isLargeScreen);
    const showFlight = !(isMobile && !isLargeScreen);
    
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
                gap: 0.5,
                width: '100%' 
              }}
            >
              <Tooltip title="Contact traveller">
                <QuestionAnswerIcon 
                  sx={{ 
                    color: '#9C27B0', 
                    fontSize: isMobile ? 16 : 20, 
                    cursor: 'pointer',
                    '&:hover': {
                      color: '#7B1FA2'
                    }
                  }} 
                  onClick={e => {
                    e.stopPropagation();
                    handleContactTraveller(cellParams.row);
                  }}
                />
              </Tooltip>
              <Tooltip title="Add a comment">
                <ChatBubbleOutlineIcon 
                  sx={{ 
                    color: '#FF8C00', 
                    fontSize: isMobile ? 16 : 20, 
                    cursor: 'pointer',
                    '&:hover': {
                      color: '#FF7700'
                    }
                  }} 
                  onClick={e => {
                    e.stopPropagation();
                    handleOpenCommentModal(cellParams.row);
                  }}
                />
              </Tooltip>
              <Tooltip title="View comments">
                <VisibilityIcon 
                  sx={{ 
                    color: '#1A9698', 
                    fontSize: isMobile ? 16 : 20, 
                    cursor: 'pointer',
                    '&:hover': {
                      color: '#158588'
                    }
                  }} 
                  onClick={e => {
                    e.stopPropagation();
                    if (tripId) navigate(`/trip/${tripId}/comments`);
                  }}
                />
              </Tooltip>
            </Box>
          );
        },
      },
    ];
    
    return baseColumns;
  }, [isMobile, isTablet, isLargeScreen, navigate, airportDataLoaded]);
  
  // Modal states
  const [openAddTripModal, setOpenAddTripModal] = React.useState(false);
  const [openCommentModal, setOpenCommentModal] = React.useState(false);
  const [selectedRowData, setSelectedRowData] = React.useState<any>(null);
  const [openMessageModal, setOpenMessageModal] = React.useState(false);
  const [selectedTripData, setSelectedTripData] = React.useState<any>(null);

  // Handle opening the Add Trip modal
  const handleOpenAddTripModal = () => {
    if (!isSignedIn || !userEmail) {
      // Show authentication required message
      setSuccessMessage('⚠️ Please sign in or register first to add a trip');
      return;
    }
    // If authenticated, open the modal
    setOpenAddTripModal(true);
  };
  
  // Handle closing the Add Trip modal
  const handleCloseAddTripModal = () => {
    setOpenAddTripModal(false);
  };
  
  // State for pagination - reduced initial page size for faster loading
  const [paginationModel, setPaginationModel] = React.useState({ pageSize: 25, page: 0 });
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


  // Fetch all data when page or pageSize changes
  React.useEffect(() => {
    fetchAllData(paginationModel.page, paginationModel.pageSize);
    // eslint-disable-next-line
  }, [paginationModel.page, paginationModel.pageSize]);

  // Remove allTrips state and related code
  const [searchLoading, setSearchLoading] = React.useState(false);

  // Optimized search with client-side filtering for better performance
  const performSearch = React.useCallback(async () => {
    if (!debouncedSearch) {
      setFilteredRows(trips);
      setPaginationModel(prev => ({ ...prev, page: 0 }));
      return;
    }

    // Try client-side search first for better performance
    const searchTerm = debouncedSearch.toLowerCase();
    const clientSideResults = trips.filter(trip => 
      trip.from?.toLowerCase().includes(searchTerm) ||
      trip.to?.toLowerCase().includes(searchTerm) ||
      trip.flight?.toLowerCase().includes(searchTerm) ||
      trip.layover?.toLowerCase().includes(searchTerm)
    );

    // If we have results from client-side search or limited dataset, use them
    if (clientSideResults.length > 0 || trips.length < 100) {
      setFilteredRows(clientSideResults);
      setRowCount(clientSideResults.length);
      setPaginationModel(prev => ({ ...prev, page: 0 }));
      return;
    }

    // Fallback to server-side search for comprehensive results
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
        limit: 50 // Further reduced limit for faster response
      });

      const searchResults = transformTripData(result.data || []);
      const sortedResults = [...searchResults].sort((a, b) => a.date.localeCompare(b.date));
  
      setFilteredRows(sortedResults);
      setPaginationModel(prev => ({ ...prev, page: 0 }));
      setRowCount(sortedResults.length);
    } catch (error) {
      console.error('Error performing search:', error);
      setFilteredRows([]);
      setRowCount(0);
    } finally {
      setSearchLoading(false);
    }
  }, [debouncedSearch, trips]);

  React.useEffect(() => {
    performSearch();
  }, [performSearch]);

  // Update handleAddTripSubmit to handle ID generation
  const handleAddTripSubmit = async (tripData: any) => {
    try {
      // Check if user is authenticated
      if (!isSignedIn || !userEmail) {
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
        userEmail: userEmail,
        fromCity: tripData.fromCity,
        toCity: tripData.toCity,
        confirmed: tripData.isBooked,
        flightDate: dateFormatter.convertToStandardDate(tripData.flightDate),
        createdAt: new Date().toISOString()
      };
      if (tripData.layoverCities && tripData.layoverCities.length > 0) {
        tripInput.layoverCity = tripData.layoverCities;
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
      if (tripData.languagePreferences && tripData.languagePreferences.length > 0) {
        tripInput.languagePreferences = tripData.languagePreferences;
      }
      const createdTrip = await client.models.Trips.create(tripInput);
      if (createdTrip.data) {
        const newTrip = {
          id: createdTrip.data.tripId,
          tripId: createdTrip.data.tripId,
          from: createdTrip.data.fromCity,
          to: createdTrip.data.toCity,
          layover: Array.isArray(createdTrip.data.layoverCity) ? createdTrip.data.layoverCity.join(', ') : createdTrip.data.layoverCity || '',
          date: formatDateToDDMONYYYY(createdTrip.data.flightDate),
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
  const handleOpenCommentModal = (rowData: any) => {
    if (!isSignedIn || !userEmail) {
      setSuccessMessage('⚠️ Please sign in or register first to add a comment');
      return;
    }
    setSelectedRowData(rowData);
    setOpenCommentModal(true);
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
        const username = localStorage.getItem('username');
        
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
              email: appConfig.defaultEmail,
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

  // Function to handle contacting traveller
  const handleContactTraveller = (tripData: any) => {
    if (!isSignedIn || !userEmail) {
      setSuccessMessage('⚠️ Please sign in or register first to contact a traveller');
      return;
    }
    setSelectedTripData(tripData);
    setOpenMessageModal(true);
  };

  // Function to handle closing the message modal
  const handleCloseMessageModal = () => {
    setOpenMessageModal(false);
    setSelectedTripData(null);
  };

  // Handle message sent callback from modal
  const handleMessageSent = (success: boolean, message: string) => {
    setSuccessMessage(message);
    if (success) {
      // Optionally close modal after successful send
      // handleCloseMessageModal();
    }
  };

  // Optimized caching with timestamp and expiry
  React.useEffect(() => {
    if (trips.length > 0) {
      const cacheData = {
        trips,
        timestamp: Date.now(),
        expiry: 5 * 60 * 1000 // 5 minutes cache
      };
      localStorage.setItem('cachedTrips', JSON.stringify(cacheData));
    }
  }, [trips]);

  // Load cached data on mount with expiry check
  React.useEffect(() => {
    const cachedTrips = localStorage.getItem('cachedTrips');
    const cachedAirports = localStorage.getItem('airportData');
    
    let shouldLoadFromCache = false;
    
    if (cachedTrips) {
      try {
        const { trips: tripsData, timestamp, expiry } = JSON.parse(cachedTrips);
        const now = Date.now();
        
        // Check if cache is still valid
        if (timestamp && now - timestamp < expiry) {
          setTrips(tripsData);
          setFilteredRows(tripsData);
          shouldLoadFromCache = true;
        } else {
          localStorage.removeItem('cachedTrips');
        }
      } catch (e) {
        console.warn('Failed to parse cached trips');
        localStorage.removeItem('cachedTrips');
      }
    }
    
    if (cachedAirports) {
      try {
        const airportsData = JSON.parse(cachedAirports);
        setAirportData(airportsData);
        setAirportDataLoaded(true);
      } catch (e) {
        console.warn('Failed to parse cached airport data');
        localStorage.removeItem('airportData');
      }
    }
    
    if (shouldLoadFromCache) {
      setLoadingTrips(false);
    }
  }, []);

  // Function to handle cell click events
  const handleCellClick = (cellParams: any) => {
    if (cellParams.field === 'actions') {
      // Handle comment icon click (since view icon has its own onClick handler)
      handleOpenCommentModal(cellParams.row);
    }
  };

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
    if (airportData.length === 0) {
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
  }, [airportLookupMaps, airportData.length]);

  // Combined data fetching - fetch both trips and airport data together
  const fetchAllData = React.useCallback(async (page: number, pageSize: number) => {
    setLoadingTrips(true);
    try {
      const client = generateClient<Schema>();
      const today = new Date().toISOString().split('T')[0];
      
      // Start both API calls in parallel
      const tripsPromise = client.models.Trips.list({ 
        limit: pageSize, 
        nextToken: pageTokens[page],
        filter: {
          flightDate: { ge: today }
        }
      });
      
      let airportsPromise: Promise<Schema["Airports"]["type"][]> = Promise.resolve([]);
      
      // Only fetch airports if not already cached
      if (airportData.length === 0) {
        const cachedAirports = localStorage.getItem('airportData');
        if (cachedAirports) {
          try {
            const parsed = JSON.parse(cachedAirports);
            setAirportData(parsed);
          } catch (e) {
            console.warn('Failed to parse cached airport data');
            localStorage.removeItem('airportData');
            airportsPromise = fetchAirportsData(client);
          }
        } else {
          airportsPromise = fetchAirportsData(client);
        }
      }
      
      // Wait for both API calls to complete
      const [tripsResult, airportsResult] = await Promise.all([tripsPromise, airportsPromise]);
      
      // Process trips data
      const tripsData = transformTripData(tripsResult.data || []);
      const sortedTrips = [...tripsData].sort((a, b) => a.date.localeCompare(b.date));

      setTrips(sortedTrips);
      setFilteredRows(sortedTrips);
      
      const newPageTokens = [...pageTokens];
      newPageTokens[page + 1] = tripsResult.nextToken || undefined;
      setPageTokens(newPageTokens);
      
      if (tripsResult.nextToken) {
        setRowCount((page + 1) * pageSize + 1);
      } else {
        setRowCount((page * pageSize) + tripsData.length);
      }
      
      // Process airports data if fetched
      if (airportsResult.length > 0) {
        setAirportData(airportsResult);
        setAirportDataLoaded(true);
        localStorage.setItem('airportData', JSON.stringify(airportsResult));
      }
      
    } catch (err) {
      console.error('Error fetching data:', err);
      setTrips([]);
      setFilteredRows([]);
    } finally {
      setLoadingTrips(false);
    }
  }, [pageTokens, airportData.length]);
  
  // Helper function to fetch airports data
  const fetchAirportsData = async (client: any) => {
    try {
      let allAirports: Schema["Airports"]["type"][] = [];
      let nextToken: string | null | undefined = undefined;
      
      // Fetch all airports with pagination
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
      console.error("Error fetching airport data:", error);
      return [];
    }
  };

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
          bgcolor: '#ffffff',
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

        {/* Modern Hero Section */}
        <Box
          sx={{
            background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(241, 245, 249, 0.9) 100%)',
            py: { xs: 3, sm: 4, md: 5 }, // Reduced from 4,6,8
            px: { xs: 2, sm: 3, md: 4 },
            borderRadius: '0 0 40px 40px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `radial-gradient(circle at 30% 20%, rgba(245, 158, 11, 0.1) 0%, transparent 50%),
                           radial-gradient(circle at 70% 80%, rgba(59, 130, 246, 0.08) 0%, transparent 50%)`,
              zIndex: 1,
            }
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 2, maxWidth: '1200px', mx: 'auto' }}>
            {/* Welcome Section */}
            <Box sx={{ textAlign: 'center', mb: { xs: 2.5, md: 3.5 } }}>
              <Typography 
                variant="h2" 
                sx={{ 
                  fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.75rem' }, // Slightly reduced
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  mb: 1.5 // Reduced from 2
                }}
              >
                Find Your Travel Companions
              </Typography>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: '#6b7280',
                  fontSize: { xs: '0.95rem', sm: '1.05rem' }, // Slightly reduced
                  maxWidth: '600px',
                  mx: 'auto',
                  lineHeight: 1.6
                }}
              >
                Connect with fellow travelers and explore the world together
              </Typography>
            </Box>

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
                  data-guide="search-input"
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
          </Box>
        </Box>

        {/* Main content area */}
        <Box 
          component="main"
          data-guide="main-content"
          sx={{
            width: '100%',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: { xs: 1.5, sm: 2, md: 3 },
            maxWidth: '1400px',
            mx: 'auto',
            position: 'static',
            overflow: 'visible',
          }}
        >


          {/* Modern Section Header */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            width: '100%',
            mb: { xs: 2, sm: 2.5 },
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 2, sm: 0 }
          }}>
            <Box>
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
                  mb: 0.5
                }}
              >
                Travel detail
              </Typography>
            </Box>
            
            <Button
              variant="contained"
              data-guide="add-trip-button"
              startIcon={
                <Box 
                  sx={{ 
                    width: 24, 
                    height: 24, 
                    borderRadius: '50%', 
                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    fontWeight: 'bold',
                  }}
                >
                  +
                </Box>
              }
              sx={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: 'white',
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1rem',
                px: { xs: 3, sm: 4 },
                py: { xs: 1.5, sm: 2 },
                borderRadius: '20px',
                boxShadow: '0 8px 24px rgba(245, 158, 11, 0.3)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 12px 32px rgba(245, 158, 11, 0.4)',
                },
              }}
              onClick={handleOpenAddTripModal}
            >
              Add Your Trip
            </Button>
          </Box>

          {/* Modern Data Grid Section */}
          <Box 
            data-guide="travel-details"
            sx={{ 
              width: '100%', 
              maxWidth: '100%',
              position: 'static',
              overflow: 'visible',
              zIndex: 1,
            }}
          >
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
                alignItems: loadingTrips ? 'center' : 'flex-start',
                justifyContent: loadingTrips ? 'center' : 'flex-start',
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
              {loadingTrips ? (
                <CircularProgress size={48} sx={{ mx: 'auto', my: 8 }} />
              ) : (
                <OptimizedDataGrid
                  rows={filteredRows}
                  columns={responsiveColumns}
                  loading={loadingTrips}
                  paginationModel={paginationModel}
                  onPaginationModelChange={handlePaginationModelChange}
                  rowCount={rowCount}
                  paginationMode={debouncedSearch ? "client" : "server"}
                  columnVisibilityModel={columnVisibilityModel}
                  onColumnVisibilityModelChange={handleColumnVisibilityModelChange}
                  onCellClick={handleCellClick}
                  isMobile={isMobile}
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
        isLoading={airportData.length === 0}
      />
      
      {/* Comment Modal */}
      <CommentModal
        open={openCommentModal}
        onClose={handleCloseCommentModal}
        onSubmit={handleCommentSubmit}
        rowData={selectedRowData}
      />

      {/* Travel Chat Modal */}
      <TravelChatModal
        open={openMessageModal}
        onClose={handleCloseMessageModal}
        travelerData={selectedTripData ? {
          userEmail: selectedTripData.userEmail,
          ownerName: selectedTripData.ownerName,
          firstName: selectedTripData.firstName,
          lastName: selectedTripData.lastName,
          from: selectedTripData.from,
          to: selectedTripData.to,
          date: selectedTripData.date,
          flight: selectedTripData.flight,
          tripId: selectedTripData.tripId
        } : null}
        currentUserEmail={userEmail || ''}
        onMessageSent={handleMessageSent}
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