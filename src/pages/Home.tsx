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
  Divider,
  Snackbar,
  Alert
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import UserData from '../components/UserData';
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
  const [filteredRows, setFilteredRows] = React.useState<any[]>([]);
  const [loadingTrips, setLoadingTrips] = React.useState(true);
  const [trips, setTrips] = React.useState<any[]>([]);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const customTheme = useTheme();
  const isMobile = useMediaQuery(customTheme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(customTheme.breakpoints.down('md'));
  const isLargeScreen = useMediaQuery(customTheme.breakpoints.up('lg'));
  const navigate = useNavigate();
  
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
                onClick={() => navigate(`/trip/${cellParams.row.id}/comments`)}
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
  
  // Function to fetch trips from DynamoDB
  const fetchTrips = async () => {
    setLoadingTrips(true);
    try {
      const client = generateClient<Schema>();
      let allTrips: any[] = [];
      let nextToken: string | undefined = undefined;
      do {
        let result: any = await client.models.Trips.list({ nextToken }) as any;
        const tripsData = (result.data || []).map((trip: any, idx: number) => ({
          id: trip.tripId || allTrips.length + idx,
          from: trip.fromCity,
          to: trip.toCity,
          layover: Array.isArray(trip.layoverCity) ? trip.layoverCity.join(', ') : trip.layoverCity || '',
          date: trip.flightDate,
          time: trip.flightTime,
          booked: trip.confirmed ? 'Y' : 'N',
          flight: trip.flightDetails || '',
        }));
        allTrips = allTrips.concat(tripsData);
        nextToken = result.nextToken;
      } while (nextToken);
      setTrips(allTrips);
      setFilteredRows(allTrips);
    } catch (err) {
      setTrips([]);
      setFilteredRows([]);
    } finally {
      setLoadingTrips(false);
    }
  };

  // Initial fetch of trips
  React.useEffect(() => {
    fetchTrips();
  }, []);

  // Handle form submission
  const handleAddTripSubmit = async (tripData: any) => {
    try {
      // Get current user's email
      const { username } = await getCurrentUser();
      console.log('Current user:', username); // Debug log
      
      if (!username) {
        // Show prominent message for unauthenticated users
        setSuccessMessage('⚠️ Please sign in or register to add a trip');
        // Close the modal
        handleCloseAddTripModal();
        return;
      }

      // Create new trip in DynamoDB
      const client = generateClient<Schema>();
      const tripInput = {
        tripId: `TRIP#${Date.now()}`, // Generate unique trip ID
        userEmail: username, // Use email from Cognito
        fromCity: tripData.fromCity,
        toCity: tripData.toCity,
        layoverCity: tripData.layoverCity ? [tripData.layoverCity] : [], // Convert to array as per schema
        flightDate: tripData.flightDate,
        flightTime: tripData.flightTime,
        confirmed: tripData.isBooked,
        flightDetails: tripData.flightDetails || '',
        createdAt: new Date().toISOString()
      };
      console.log('Trip input:', tripInput); // Debug log

      try {
        const newTrip = await client.models.Trips.create(tripInput);
        console.log('Created trip:', newTrip); // Debug log

        // Show success message
        setSuccessMessage(`Trip from ${tripData.fromCity} to ${tripData.toCity} added successfully!`);
        
        // Close the modal
        handleCloseAddTripModal();
        
        // Refresh the trips data
        await fetchTrips();
        
      } catch (dbError: any) {
        console.error('Database error:', dbError);
        throw new Error(`Failed to create trip: ${dbError.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Error adding trip:', error);
      // Show more detailed error message
      const errorMessage = error.message || 'Failed to add trip. Please try again.';
      setSuccessMessage(`Error: ${errorMessage}`);
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
        const { username } = await getCurrentUser();
        const client = generateClient<Schema>();
        const now = new Date().toISOString();
        const commentInput = {
          commentId: `COMMENT#${Date.now()}`,
          tripId: selectedRowData.id,
          userEmail: username,
          commentText: comment,
          createdAt: now,
          updatedAt: now,
          editable: true,
          created_by: username,
        };
        await client.models.Comments.create(commentInput);
        setSuccessMessage('Comment added successfully!');
      } catch (error: any) {
        setSuccessMessage('Error saving comment: ' + (error.message || 'Unknown error'));
      }
    }
  };

  const [paginationModel, setPaginationModel] = React.useState({ pageSize: 100, page: 0 });

  React.useEffect(() => {
    if (!search) {
      setFilteredRows(trips);
    } else {
      setFilteredRows(
        trips.filter(row =>
          Object.values(row).some(val =>
            String(val).toLowerCase().includes(search.toLowerCase())
          )
        )
      );
    }
  }, [search, trips]);

  // Function to handle cell click events
  const handleCellClick = (cellParams: any) => {
    if (cellParams.field === 'comment') {
      handleOpenCommentModal(cellParams.row);
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
                  onPaginationModelChange={setPaginationModel}
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
                  }}
                  hideFooterSelectedRowCount
                  density={isMobile ? "compact" : "standard"}
                  onCellClick={handleCellClick}
                />
              )}
            </Paper>
          </Box>

          {/* User Data from DynamoDB Section - simplified */}
          <Box sx={{ 
            width: '100%',
            mb: { xs: 4, sm: 5 }, 
            position: 'static',
          }}>
            <Paper 
              elevation={2}
              sx={{ 
                p: { xs: 2, sm: 3 },
                borderRadius: 2,
                position: 'static',
              }}
            >
              <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold', fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                DynamoDB Data
              </Typography>
              <Divider sx={{ mb: 3 }} />
              <UserData />
            </Paper>
          </Box>
        </Box>
      </Box>

      {/* Add Trip Modal */}
      <AddTripModal 
        open={openAddTripModal}
        onClose={handleCloseAddTripModal}
        onSubmit={handleAddTripSubmit}
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
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
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
      
    </ThemeProvider>
  );
} 