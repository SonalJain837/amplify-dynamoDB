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
import { Link, useNavigate } from 'react-router-dom';
import { signOut, getCurrentUser } from 'aws-amplify/auth';
import { useState, useEffect } from 'react';

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
  const navigate = useNavigate();
  const [signOutMessage, setSignOutMessage] = useState<string | null>(null);
  const [signInMessage, setSignInMessage] = useState<string | null>(null);
  const [isSignedIn, setIsSignedIn] = useState(false);
  
  // Account menu state
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  
  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    const checkUser = async () => {
      try {
        await getCurrentUser();
        setIsSignedIn(true);
      } catch {
        setIsSignedIn(false);
      }
    };
    checkUser();
    // Listen for sign in/out events (optional: can use Hub for more robust solution)
    const handleStorage = () => {
      checkUser();
      const msg = localStorage.getItem('signInMessage');
      if (msg) {
        setSignInMessage(msg);
        setTimeout(() => setSignInMessage(null), 3000);
        localStorage.removeItem('signInMessage');
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleSignOut = async () => {
    handleMenuClose();
    try {
      await signOut();
    } catch {}
    localStorage.clear();
    sessionStorage.clear();
    setSignOutMessage('User is signed out successfully.');
    setIsSignedIn(false);
    navigate('/');
    setTimeout(() => setSignOutMessage(null), 3000);
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
            to="/contact" 
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
              {/* Show Profile only if signed in */}
              {isSignedIn && (
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
              )}
              {!isSignedIn && (
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
              )}
              {/* Only show Register if not signed in */}
              {!isSignedIn && (
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
              )}
              {isSignedIn && (
                <MenuItem
                  onClick={handleSignOut}
                  sx={{
                    ...menuItemStyles.root,
                    '&:hover': {
                      backgroundColor: '#f0f5ff !important',
                    }
                  }}
                >
                  Sign Out
                </MenuItem>
              )}
            </Menu>
          </Box>
        </Box>
      </Toolbar>
      {/* Sign out message notification */}
      {signOutMessage && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
          }}
        >
          <Typography
            variant="body1"
            sx={{
              bgcolor: '#22968b',
              color: 'white',
              px: 3,
              py: 1.5,
              borderRadius: 2,
              minWidth: '300px',
              textAlign: 'center',
              fontWeight: 600,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }}
          >
            {signOutMessage}
          </Typography>
        </Box>
      )}
      {signInMessage && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
          }}
        >
          <Typography
            variant="body1"
            sx={{
              bgcolor: '#22968b',
              color: 'white',
              px: 3,
              py: 1.5,
              borderRadius: 2,
              minWidth: '300px',
              textAlign: 'center',
              fontWeight: 600,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }}
          >
            {signInMessage}
          </Typography>
        </Box>
      )}
    </AppBar>
  );
};

export default Header; 