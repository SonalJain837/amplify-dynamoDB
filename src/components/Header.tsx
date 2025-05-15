import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Box, 
  Typography, 
  Button, 
  Menu, 
  MenuItem,
  useMediaQuery,
  useTheme
} from '@mui/material';
import FlightIcon from '@mui/icons-material/Flight';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { Link } from 'react-router-dom';

// Custom styling for dropdown menu
const menuStyles = {
  paper: {
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    marginTop: '8px',
    borderRadius: '4px',
    backgroundColor: 'white !important' // Force white background
  },
  list: {
    padding: '4px 0',
    backgroundColor: 'white !important', // Force white background
    color: '#333 !important' // Force dark text
  }
};

// Custom styling for menu items
const menuItemStyles = {
  root: {
    fontSize: '0.9rem',
    padding: '10px 20px',
    color: '#333 !important', // Force dark text color
    backgroundColor: 'white !important', // Force white background
    '&:hover': {
      backgroundColor: '#f0f5ff !important', // Force light blue hover
    },
  }
};

const Header: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Account menu state
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  
  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <AppBar 
      position="static" 
      sx={{ 
        bgcolor: 'rgb(26, 150, 152) !important', 
        zIndex: 1300, 
        width: '100%',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}
    >
      <Toolbar 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          py: { xs: 0.5, md: 1 },
          minHeight: { xs: '56px', sm: '64px' }
        }}
      >
        {/* Logo and Title */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <FlightIcon sx={{ mr: 1, fontSize: 28 }} />
          <Typography 
            variant={isMobile ? "subtitle1" : "h6"} 
            component={Link} 
            to="/" 
            sx={{ 
              fontWeight: 'bold', 
              color: 'white',
              textDecoration: 'none'
            }}
          >
            Travel to World
          </Typography>
        </Box>
        
        {/* Navigation Options */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button 
            color="inherit" 
            component={Link} 
            to="/" 
            sx={{ 
              textTransform: 'none', 
              mx: 1,
              display: { xs: 'none', sm: 'block' },
              color: 'white'
            }}
          >
            About Us
          </Button>
          <Button 
            color="inherit" 
            component={Link} 
            to="/" 
            sx={{ 
              textTransform: 'none', 
              mx: 1,
              display: { xs: 'none', sm: 'block' },
              color: 'white'
            }}
          >
            Products
          </Button>
          <Button 
            color="inherit" 
            component={Link} 
            to="/" 
            sx={{ 
              textTransform: 'none', 
              mx: 1,
              display: { xs: 'none', sm: 'block' },
              color: 'white'
            }}
          >
            Resources
          </Button>
          <Button 
            color="inherit" 
            component={Link} 
            to="/" 
            sx={{ 
              textTransform: 'none', 
              mx: 1,
              display: { xs: 'none', sm: 'block' },
              color: 'white'
            }}
          >
            Contact
          </Button>
          
          {/* My Account Dropdown */}
          <Box sx={{ display: 'flex', alignItems: 'center', ml: isMobile ? 0 : 2 }}>
            <Button
              color="inherit"
              onClick={handleMenuClick}
              endIcon={<ArrowDropDownIcon sx={{ color: 'white' }} />}
              startIcon={<AccountCircleIcon sx={{ color: 'white' }} />}
              sx={{ textTransform: 'none', color: 'white' }}
            >
              My Account
            </Button>
            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={handleMenuClose}
              PaperProps={{
                sx: {
                  ...menuStyles.paper,
                  backgroundColor: 'white',
                }
              }}
              MenuListProps={{
                sx: menuStyles.list
              }}
            >
              <MenuItem 
                component={Link} 
                to="/profile" 
                onClick={handleMenuClose}
                sx={{
                  ...menuItemStyles.root,
                  '&:hover': {
                    backgroundColor: '#f0f5ff !important',
                  }
                }}
              >
                Profile
              </MenuItem>
              <MenuItem 
                component={Link} 
                to="/login" 
                onClick={handleMenuClose}
                sx={{
                  ...menuItemStyles.root,
                  '&:hover': {
                    backgroundColor: '#f0f5ff !important',
                  }
                }}
              >
                Login
              </MenuItem>
              <MenuItem 
                component={Link} 
                to="/register" 
                onClick={handleMenuClose}
                sx={{
                  ...menuItemStyles.root,
                  '&:hover': {
                    backgroundColor: '#f0f5ff !important',
                  }
                }}
              >
                Register
              </MenuItem>
            </Menu>
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header; 