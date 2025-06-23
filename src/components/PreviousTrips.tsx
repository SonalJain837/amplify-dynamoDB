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
import { DataGrid, GridColDef, GridCellParams } from '@mui/x-data-grid';
import { generateClient } from 'aws-amplify/api';
import { type Schema } from '../../amplify/data/resource';
import { useDebounce } from 'use-debounce';
import { useNavigate } from 'react-router-dom';
import CommentModal from './CommentModal';
import { getCurrentUser } from 'aws-amplify/auth';
import { sendCommentEmail } from '../graphql/mutations';

interface PreviousTripsProps {
  onClose: () => void;
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
}

export default function PreviousTrips({ onClose }: PreviousTripsProps) {
  const customTheme = useTheme();
  const isMobile = useMediaQuery(customTheme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(customTheme.breakpoints.down('md'));
  const navigate = useNavigate();

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
  const [columnVisibilityModel, setColumnVisibilityModel] = React.useState({
    layover: !isMobile,
    time: !(isMobile && !isTablet),
    flight: !(isMobile && !isTablet && window.innerWidth < 400)
  });

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
  }, [isMobile, isTablet]);

  // Function to fetch previous trips
  const fetchPreviousTrips = async (page: number, pageSize: number) => {
    setLoadingPreviousTrips(true);
    try {
      const client = generateClient<Schema>();
      const today = new Date().toISOString().split('T')[0];
      
      const result: any = await client.models.Trips.list({ 
        limit: pageSize, 
        nextToken: previousTripsPageTokens[page],
        filter: {
          flightDate: { lt: today }
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

      // Sort data client-side by date in descending order
      const sortedTrips = [...tripsData].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setPreviousTrips(sortedTrips);
      setFilteredPreviousTrips(sortedTrips);
      
      const newPageTokens = [...previousTripsPageTokens];
      newPageTokens[page + 1] = result.nextToken;
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

  // Function to handle cell click
  const handleCellClick = (params: GridCellParams) => {
    if (params.field === 'comment') {
      handleOpenCommentModal(params.row);
    } else if (params.field === 'view') {
      const tripId = params.row.tripId || params.row.id;
      if (!tripId) {
        console.error('Trip ID not found');
        return;
      }
      onClose(); // Close the drawer
      navigate(`/trip/${tripId}/comments`);
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
          from: trip.fromCity,
          to: trip.toCity,
          layover: Array.isArray(trip.layoverCity) ? trip.layoverCity.join(', ') : trip.layoverCity || '',
          date: trip.flightDate,
          time: trip.flightTime ? trip.flightTime.slice(0,5) + 'H' : '',
          booked: trip.confirmed ? 'Y' : 'N',
          flight: trip.flightDetails || '',
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
        const user = await getCurrentUser().catch(() => null);
        const email = user?.signInDetails?.loginId || user?.username;
        const username = user?.username || localStorage.getItem('username') || 'anonymous';
        
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
          created_by: username,
        };
        
        // Create the comment
        await client.models.Comments.create(commentInput);
        setSuccessMessage('Comment added successfully!');

        // Try to send email notification
        try {
          const userEmail = email || 'anonymous@example.com';
          const apiClient = generateClient<Schema>();
          await apiClient.graphql({
            query: sendCommentEmail,
            variables: {
              email: userEmail,
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
      gap: 2,
      p: 2
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', mb: 3 }}>
        <TextField
          variant="outlined"
          placeholder="Search Travel Details..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{
            width: { xs: '100%', sm: '80%', md: '70%', lg: '60%' },
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
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 2
      }}>
        <Typography variant="h5" component="h2" sx={{ color: '#2c3e50', fontWeight: 600 }}>
          Previous Travel Details
        </Typography>
      </Box>

      <Paper 
        elevation={3}
        sx={{ 
          borderRadius: 2,
          overflow: 'visible',
          boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: loadingPreviousTrips ? 'center' : 'flex-start',
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
              '& .MuiDataGrid-columnHeader': {
                fontWeight: 'bold',
                backgroundColor: 'rgb(26, 150, 152)',
                color: 'white',
              },
              border: 'none',
              width: '100%',
              minHeight: '400px',
              '& .MuiDataGrid-cell': {
                borderBottom: '1px solid #f0f0f0',
                fontSize: isMobile ? '0.8rem' : '0.85rem',
                padding: isMobile ? '6px 4px' : '6px 16px',
                whiteSpace: 'normal',
                wordWrap: 'break-word',
              },
              '.MuiDataGrid-row:hover': {
                backgroundColor: '#f5f5f5',
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