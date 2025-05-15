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
  Divider
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import UserData from '../components/UserData';
import Header from '../components/Header';
import { Amplify } from 'aws-amplify';
// Ensure the amplify_outputs.json is correctly imported
// If the import fails, you need to run 'npx ampx sandbox' to generate it 
import amplifyconfig from '../../amplify_outputs.json';
import AddTripModal from '../components/AddTripModal';
import CommentModal from '../components/CommentModal';

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

// Updated data to match the image
const rows = [
  {
    id: 1,
    from: 'LAX',
    to: 'MUM',
    layover: 'FRA',
    date: '05-JUN-2025',
    time: '13:00H',
    booked: 'Y',
    flight: 'AM 495, LH878',
  },
  {
    id: 2,
    from: 'JFK',
    to: 'LHR',
    layover: 'CDG',
    date: '12-AUG-2025',
    time: '09:30H',
    booked: 'N',
    flight: 'BA 117, AF 450',
  },
  {
    id: 3,
    from: 'ORD',
    to: 'DXB',
    layover: 'IST',
    date: '20-SEP-2025',
    time: '23:45H',
    booked: 'Y',
    flight: 'EK 236, TK 777',
  },
  {
    id: 4,
    from: 'SFO',
    to: 'SYD',
    layover: 'LAX',
    date: '15-OCT-2025',
    time: '16:00H',
    booked: 'Y',
    flight: 'QF 74, AA 133',
  },
  {
    id: 5,
    from: 'HKG',
    to: 'DEL',
    layover: 'BKK',
    date: '01-NOV-2025',
    time: '11:15H',
    booked: 'N',
    flight: 'CX 698, AI 102',
  },
  {
    id: 6,
    from: 'HKG',
    to: 'DEL',
    layover: 'BKK',
    date: '01-NOV-2025',
    time: '11:15H',
    booked: 'N',
    flight: 'CX 698, AI 102',
  },
  {
    id: 7,
    from: 'HKG',
    to: 'DEL',
    layover: 'BKK',
    date: '01-NOV-2025',
    time: '11:15H',
    booked: 'N',
    flight: 'CX 698, AI 102',
  },
  {
    id: 8,
    from: 'HKG',
    to: 'DEL',
    layover: 'BKK',
    date: '01-NOV-2025',
    time: '11:15H',
    booked: 'N',
    flight: 'CX 698, AI 102',
  },
  {
    id: 9,
    from: 'HKG',
    to: 'DEL',
    layover: 'BKK',
    date: '01-NOV-2025',
    time: '11:15H',
    booked: 'N',
    flight: 'CX 698, AI 102',
  },
  {
    id: 10,
    from: 'HKG',
    to: 'DEL',
    layover: 'BKK',
    date: '01-NOV-2025',
    time: '11:15H',
    booked: 'N',
    flight: 'CX 698, AI 102',
  },
  {
    id: 11,
    from: 'HKG',
    to: 'DEL',
    layover: 'BKK',
    date: '01-NOV-2025',
    time: '11:15H',
    booked: 'N',
    flight: 'CX 698, AI 102',
  },
];

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
  const [filteredRows, setFilteredRows] = React.useState(rows);
  const customTheme = useTheme();
  const isMobile = useMediaQuery(customTheme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(customTheme.breakpoints.down('md'));
  const isLargeScreen = useMediaQuery(customTheme.breakpoints.up('lg'));
  
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
    ];
    
    return baseColumns;
  }, [isMobile, isTablet, isLargeScreen]);
  
  // Modal states
  const [openAddTripModal, setOpenAddTripModal] = React.useState(false);
  const [openCommentModal, setOpenCommentModal] = React.useState(false);
  const [selectedRowData, setSelectedRowData] = React.useState<any>(null);
  
  // Handle opening the Add Trip modal
  const handleOpenAddTripModal = () => {
    setOpenAddTripModal(true);
  };
  
  // Handle closing the Add Trip modal
  const handleCloseAddTripModal = () => {
    setOpenAddTripModal(false);
  };
  
  // Handle form submission
  const handleAddTripSubmit = (tripData: any) => {
    // Format the date for display
    const formatDate = (dateStr: string) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }).toUpperCase();
    };
    
    // Format time for display
    const formatTime = (timeStr: string) => {
      if (!timeStr) return '';
      return timeStr + 'H';
    };
    
    // Create new trip object
    const newTrip = {
      id: rows.length + 1,
      from: tripData.fromCity,
      to: tripData.toCity,
      layover: tripData.layoverCity || '',
      date: formatDate(tripData.flightDate),
      time: formatTime(tripData.flightTime),
      booked: tripData.isBooked ? 'Y' : 'N',
      flight: tripData.flightDetails
    };
    
    // Add to rows
    const updatedRows = [...rows, newTrip];
    rows.push(newTrip); // Update the original data
    
    // Update filtered rows
    setFilteredRows(search ? 
      updatedRows.filter(row =>
        Object.values(row).some(val =>
          String(val).toLowerCase().includes(search.toLowerCase())
        )
      ) : updatedRows
    );
    
    console.log("New trip added:", newTrip);
  };

  // Function to handle opening the comment modal
  const handleOpenCommentModal = (rowData: any) => {
    setSelectedRowData(rowData);
    setOpenCommentModal(true);
  };
  
  // Function to handle closing the comment modal
  const handleCloseCommentModal = () => {
    setOpenCommentModal(false);
    setSelectedRowData(null);
  };
  
  // Function to handle comment submission
  const handleCommentSubmit = (comment: string) => {
    if (selectedRowData) {
      console.log(`Comment submitted for flight ${selectedRowData.from} to ${selectedRowData.to}: ${comment}`);
      // Here you would typically update the database with the comment
      // For now, we'll just log it
    }
  };

  React.useEffect(() => {
    if (!search) {
      setFilteredRows(rows);
    } else {
      setFilteredRows(
        rows.filter(row =>
          Object.values(row).some(val =>
            String(val).toLowerCase().includes(search.toLowerCase())
          )
        )
      );
    }
  }, [search]);

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
              }}
            >
              <DataGrid
                rows={filteredRows}
                columns={responsiveColumns}
                pageSizeOptions={[100, 150]}
                initialState={{ 
                  pagination: { 
                    paginationModel: { pageSize: 100 } 
                  } 
                }}
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
      
    </ThemeProvider>
  );
} 