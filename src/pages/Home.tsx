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
import { v4 as uuidv4 } from 'uuid';
// import { sendCommentEmail } from '../graphql/mutations';

// Configure Amplify with the generated outputs
try {
  Amplify.configure(amplifyconfig);
} catch (error) {
  console.error('Error configuring Amplify:', error);
}

// Create responsive columns using hooks
export default function Home() {
  const [search, setSearch] = React.useState('');
  const [debouncedSearch] = useDebounce(search, 300);
  const [filteredRows, setFilteredRows] = React.useState<any[]>([]);
  const [loadingTrips, setLoadingTrips] = React.useState(true);
  const [trips, setTrips] = React.useState<any[]>([]);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [searchLoading, setSearchLoading] = React.useState(false);
  const [paginationModel, setPaginationModel] = React.useState({ pageSize: 100, page: 0 });
  const customTheme = useTheme();
  const isMobile = useMediaQuery(customTheme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(customTheme.breakpoints.down('md'));
  const isLargeScreen = useMediaQuery(customTheme.breakpoints.up('lg'));
  const navigate = useNavigate();
  const client = generateClient<Schema>();
  
  // Add state for airport data
  const [airportData, setAirportData] = React.useState<Schema["Airports"]["type"][]>([]);
  
  // Fetch airport data on component mount and store in local storage
  React.useEffect(() => {
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
  const [currentUserEmail, setCurrentUserEmail] = React.useState<string | null>(null);

  React.useEffect(() => {
    const checkUser = async () => {
      try {
        const { signInDetails } = await getCurrentUser();
        if (signInDetails?.loginId) {
          setCurrentUserEmail(signInDetails.loginId);
        }
      } catch (error) {
        console.error("Error fetching current user:", error);
      }
    };
    checkUser();
  }, []);

  const handleOpenAddTripModal = async () => {
    // Ensure user is signed in before opening the modal
    try {
      await getCurrentUser();
      setOpenAddTripModal(true);
    } catch (error) {
      setSuccessMessage("Please sign in to add a trip.");
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleCloseAddTripModal = () => {
    setOpenAddTripModal(false);
    setSuccessMessage(null); // Clear any success messages when modal closes
  };

  const handlePaginationModelChange = (newModel: any) => {
    setPaginationModel(newModel);
  };

  const fetchTrips = async (page: number, pageSize: number) => {
    setLoadingTrips(true);
    try {
      const { data: fetchedTrips, nextToken } = await client.models.Trips.list({
        limit: pageSize,
        // Use nextToken for pagination if available
        // nextToken: tripPageTokens[page]
      });

      const formattedTrips = fetchedTrips.map(trip => ({
        id: trip.tripId, // Use tripId as unique id for DataGrid
        from: trip.fromCity,
        to: trip.toCity,
        layover: trip.layoverCity ? trip.layoverCity.join(', ') : 'N/A',
        date: trip.flightDate || 'N/A',
        time: trip.flightTime || 'N/A',
        booked: trip.confirmed ? 'Yes' : 'No',
        flight: trip.flightDetails || 'N/A',
        userEmail: trip.userEmail,
      }));

      setTrips(formattedTrips);
      setFilteredRows(formattedTrips);
      // setPreviousTripsRowCount(count); // If count is available
    } catch (error) {
      console.error("Error fetching trips:", error);
    } finally {
      setLoadingTrips(false);
    }
  };

  // Filter and search trips
  React.useEffect(() => {
    if (search.trim() === '') {
      setFilteredRows(trips);
    } else {
      setSearchLoading(true);
      const results = trips.filter(trip =>
        trip.from.toLowerCase().includes(search.toLowerCase()) ||
        trip.to.toLowerCase().includes(search.toLowerCase()) ||
        trip.layover.toLowerCase().includes(search.toLowerCase()) ||
        trip.flight.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredRows(results);
      setSearchLoading(false);
    }
  }, [debouncedSearch, trips]);

  // Fetch trips on initial load and when pagination changes
  React.useEffect(() => {
    fetchTrips(0, 100); // Fetch initial trips
  }, []); // Empty dependency array means this runs once on mount

  const generateUniqueId = async (): Promise<string> => {
    try {
      const { data: lastTrip } = await client.models.Trips.list({ limit: 1, authMode: 'apiKey' });
      const currentId = lastTrip && lastTrip.length > 0 ? parseInt(lastTrip[0].tripId.replace('TRIP', '')) : 0;
      return `TRIP${(currentId + 1).toString().padStart(4, '0')}`;
    } catch (error) {
      console.error("Error generating unique ID:", error);
      return `TRIP${(Math.floor(Math.random() * 10000)).toString().padStart(4, '0')}`;
    }
  };

  const performSearch = async () => {
    setSearchLoading(true);
    try {
      let searchCriteria: any = {};
      if (search.trim() !== '') {
        searchCriteria = {
          or: [
            { fromCity: { contains: search.toLowerCase() } },
            { toCity: { contains: search.toLowerCase() } },
            { layoverCity: { contains: search.toLowerCase() } },
            { flightDetails: { contains: search.toLowerCase() } },
          ],
        };
      }

      const { data: searchResults } = await client.models.Trips.list({
        filter: searchCriteria,
      });
      const formattedSearchResults = searchResults.map(trip => ({
        id: trip.tripId, // Use tripId as unique id for DataGrid
        from: trip.fromCity,
        to: trip.toCity,
        layover: trip.layoverCity ? trip.layoverCity.join(', ') : 'N/A',
        date: trip.flightDate || 'N/A',
        time: trip.flightTime || 'N/A',
        booked: trip.confirmed ? 'Yes' : 'No',
        flight: trip.flightDetails || 'N/A',
        userEmail: trip.userEmail,
      }));

      setFilteredRows(formattedSearchResults);
    } catch (error) {
      console.error("Error performing search:", error);
    } finally {
      setSearchLoading(false);
    }
  };

  React.useEffect(() => {
    if (debouncedSearch) {
      performSearch();
    }
  }, [debouncedSearch]);

  const handleAddTripSubmit = async (tripData: any) => {
    try {
      const tripId = await generateUniqueId();
      const currentUser = await getCurrentUser();
      const userEmail = currentUser.signInDetails?.loginId || currentUser.username; // Get email from sign-in details or username

      if (!userEmail) {
        console.error("User email not found. Cannot add trip.");
        setSuccessMessage("Error: User not logged in.");
        setTimeout(() => setSuccessMessage(null), 3000);
        return;
      }

      await client.models.Trips.create({
        tripId,
        userEmail: userEmail,
        fromCity: tripData.fromCity.toUpperCase(),
        toCity: tripData.toCity.toUpperCase(),
        layoverCity: tripData.layoverCity ? tripData.layoverCity.split(',').map((city: string) => city.trim().toUpperCase()) : [],
        flightDate: tripData.flightDate,
        flightTime: tripData.flightTime,
        confirmed: tripData.confirmed === 'Yes',
        flightDetails: tripData.flightDetails,
        createdAt: new Date().toISOString(),
      });

      setSuccessMessage('Trip added successfully!');
      // Re-fetch trips to update the table
      fetchTrips(0, 100); // Reset to first page after adding
    } catch (error) {
      console.error("Error adding trip:", error);
      setSuccessMessage(`Error adding trip: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setOpenAddTripModal(false);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleOpenCommentModal = async (rowData: any) => {
    try {
      await getCurrentUser();
      setSelectedRowData(rowData);
      setOpenCommentModal(true);
    } catch (error) {
      setSuccessMessage("Please sign in to add a comment.");
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleCloseCommentModal = () => {
    setOpenCommentModal(false);
    setSelectedRowData(null);
  };

  const handleCommentSubmit = async (comment: string) => {
    if (!selectedRowData || !currentUserEmail) return;

    try {
      // Create the comment in DynamoDB
      const newCommentId = `COMMENT${uuidv4()}`;
      await client.models.Comments.create({
        commentId: newCommentId,
        tripId: selectedRowData.id,
        userEmail: currentUserEmail,
        commentText: comment,
        createdAt: new Date().toISOString(),
        notifyEmail: false, // Default to false, can be set by user in the future
        created_by: currentUserEmail, // Or a more user-friendly name if available
      });

      // Send email notification (if enabled/needed)
      // This part assumes sendCommentEmail is a GraphQL mutation defined in your backend
      // const emailSubject = `New comment on your trip to ${selectedRowData.to}`; // Customize subject
      // const emailMessage = `A new comment has been added to your trip (${selectedRowData.from} to ${selectedRowData.to}): ${comment}`;

      // await client.mutations.sendCommentEmail({ // Assuming you have a mutation defined for this
      //   email: selectedRowData.userEmail, // Email of the trip owner
      //   subject: emailSubject,
      //   message: emailMessage,
      // });

      setSuccessMessage('Comment added successfully!');
    } catch (error) {
      console.error("Error adding comment:", error);
      setSuccessMessage(`Error adding comment: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      handleCloseCommentModal();
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleCellClick = (cellParams: any) => {
    if (cellParams.field === 'comment') {
      handleOpenCommentModal(cellParams.row);
    }
  };

  return (
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
    </Box>
  );
} 