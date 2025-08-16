import { createTheme } from '@mui/material';

// Global CSS for DataGrid headers
export const dataGridHeaderStyles = `
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

export const customGlobalStyles = {
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
};

const theme = createTheme({
  typography: {
    fontFamily: 'Inter, sans-serif',
    h4: {
      fontSize: '2.125rem',
      fontWeight: 600,
      lineHeight: 1.235,
      letterSpacing: '0.00735em',
    },
    h5: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.334,
      letterSpacing: '0em',
    },
  },
  palette: {
    primary: {
      main: '#1A9698', // Your primary color
    },
    secondary: {
      main: '#FF8C00', // A vibrant orange for secondary actions
    },
    error: {
      main: '#d32f2f', // Standard Material-UI error color
    },
    background: {
      default: '#ffffff', // Clean white background
      paper: '#ffffff', // White for paper components
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px', // Slightly rounded corners for buttons
          textTransform: 'none', // Prevent uppercase transformation
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'small',
      },
      styleOverrides: {
        root: {
          // Some global styles for text fields if needed
        },
      },
    },
    MuiSelect: {
      defaultProps: {
        variant: 'outlined',
        size: 'small',
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          // No specific overrides here, keeping it flexible
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)', // Subtle shadow for cards/paper
        },
      },
    },
  },
});

export default theme; 