import React, { memo, useCallback, useMemo } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Box, 
  Typography, 
  Button, 
  Menu, 
  MenuItem,
  useMediaQuery,
  useTheme,
  GlobalStyles,
} from '@mui/material';
import FlightIcon from '@mui/icons-material/Flight';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'aws-amplify/auth';
import { useState } from 'react';
import { Alert, Avatar, Chip, Divider } from '@mui/material';
import { useUser } from '../contexts/UserContext';
import ModernBanner from './ModernBanner';
// GUIDE FUNCTIONALITY HIDDEN - IMPORT COMMENTED OUT
// import { GuideIcon } from './Guide/GuideIcon';

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

const Header: React.FC = memo(() => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const [signOutMessage, setSignOutMessage] = useState<string | null>(null);
  const [signInMessage, setSignInMessage] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  
  // Use shared user context
  const { userData, refreshUser } = useUser();
  const { isSignedIn, userDisplayName, isLoading } = userData;
  
  // Account menu state
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  
  const handleMenuClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);
  
  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  // Check for sign in message on mount
  React.useEffect(() => {
    const msg = localStorage.getItem('signInMessage');
    if (msg) {
      setSignInMessage(msg);
      setTimeout(() => setSignInMessage(null), 3000);
      localStorage.removeItem('signInMessage');
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    if (isSigningOut) return; // Prevent multiple simultaneous sign-out attempts
    
    setIsSigningOut(true);
    
    // Immediately clear local state and provide feedback
    localStorage.clear();
    sessionStorage.clear();
    
    // Show success message immediately
    setSignOutMessage('Successfully signed out!');
    
    // Close menu immediately
    handleMenuClose();
    
    // Navigate to home page immediately
    navigate('/');
    
    // Clear message after 3 seconds
    setTimeout(() => setSignOutMessage(null), 3000);
    
    // Perform AWS Cognito sign out in background (non-blocking)
    signOut()
      .then(() => {
        console.log('AWS Cognito sign out completed');
        // Refresh user context after sign out
        refreshUser();
      })
      .catch((error) => {
        console.warn('AWS Cognito sign out failed, but user is signed out locally:', error);
        // Still refresh user context
        refreshUser();
      })
      .finally(() => {
        setIsSigningOut(false);
      });
  }, [isSigningOut, navigate, refreshUser, handleMenuClose]);

  return (
    <>
      <GlobalStyles
        styles={{
          '@keyframes spin': {
            '0%': {
              transform: 'rotate(0deg)',
            },
            '100%': {
              transform: 'rotate(360deg)',
            },
          },
          '@keyframes slideInDown': {
            '0%': {
              transform: 'translateX(-50%) translateY(-20px)',
              opacity: 0,
            },
            '100%': {
              transform: 'translateX(-50%) translateY(0)',
              opacity: 1,
            },
          },
        }}
      />
      <AppBar 
        position="static" 
        sx={{ 
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)',
          zIndex: 1300, 
          width: '100%',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          borderBottom: '1px solid rgba(245, 158, 11, 0.15)'
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
            <Box
              sx={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: { xs: 36, sm: 40 },
                height: { xs: 36, sm: 40 },
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                mr: { xs: 1.5, sm: 2 },
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 20px rgba(245, 158, 11, 0.4)',
                }
              }}
            >
              <FlightIcon sx={{ 
                fontSize: { xs: 20, sm: 24 }, 
                color: 'white',
                transform: 'rotate(-45deg)'
              }} />
            </Box>
            <Typography 
              variant={isMobile ? "h6" : "h5"} 
              component={Link} 
              to="/" 
              sx={{ 
                fontWeight: 800,
                fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.4rem' },
                background: 'linear-gradient(135deg, #1f2937 0%, #374151 50%, #f59e0b 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textDecoration: 'none',
                letterSpacing: '-0.02em',
                fontFamily: '"Poppins", "Inter", sans-serif',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #1f2937 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  transform: 'translateY(-1px)',
                }
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
              to="/previous-trips" 
              sx={{ 
                textTransform: 'none', 
                mx: 1,
                display: { xs: 'none', sm: 'block' },
                color: '#374151',
                fontWeight: 500,
                '&:hover': {
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  color: '#f59e0b'
                }
              }}
            >
              Previous Trips
            </Button>
            <Button 
              color="inherit" 
              component={Link} 
              to="/about" 
              sx={{ 
                textTransform: 'none', 
                mx: 1,
                display: { xs: 'none', sm: 'block' },
                color: '#374151',
                fontWeight: 500,
                '&:hover': {
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  color: '#f59e0b'
                }
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
                color: '#374151',
                fontWeight: 500,
                '&:hover': {
                  backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  color: '#f59e0b'
                }
              }}
            >
              Contact
            </Button>
            {isSignedIn && (
              <Button 
                color="inherit" 
                component={Link} 
                to="/messages" 
                sx={{ 
                  textTransform: 'none', 
                  mx: 1,
                  display: { xs: 'none', sm: 'flex' },
                  color: '#374151',
                  fontWeight: 500,
                  '&:hover': {
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    color: '#f59e0b'
                  }
                }}
              >
                Messages
              </Button>
            )}
            
            {/* GUIDE FUNCTIONALITY HIDDEN - GUIDE ICON COMMENTED OUT */}
            {/* <GuideIcon /> */}
            
            {/* Username Display and Account Dropdown */}
            <Box sx={{ display: 'flex', alignItems: 'center', ml: isMobile ? 0 : 2 }}>
              {/* Primary Username Display - Always visible when signed in */}
              {isSignedIn && userDisplayName && (
                <Box sx={{ 
                  display: 'flex',
                  alignItems: 'center', 
                  mr: 2
                }}>
                  <Chip
                    avatar={
                      <Avatar sx={{ 
                        bgcolor: '#f59e0b', 
                        color: '#ffffff',
                        width: 32,
                        height: 32,
                        fontSize: '0.875rem',
                        fontWeight: 700
                      }}>
                        {userDisplayName.charAt(0).toUpperCase()}
                      </Avatar>
                    }
                    label={userDisplayName}
                    variant="outlined"
                    data-guide="profile-menu"
                    sx={{
                      color: '#1f2937',
                      borderColor: 'rgba(245, 158, 11, 0.6)',
                      backgroundColor: 'rgba(245, 158, 11, 0.1)',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      height: 40,
                      '&:hover': {
                        backgroundColor: 'rgba(245, 158, 11, 0.2)',
                        borderColor: '#f59e0b',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
                      },
                      '& .MuiChip-label': {
                        color: '#1f2937',
                        fontWeight: 600,
                        px: 1
                      },
                      '& .MuiChip-avatar': {
                        marginLeft: 1
                      },
                      transition: 'all 0.2s ease-in-out'
                    }}
                    clickable
                    onClick={(event) => handleMenuClick(event as any)}
                  />
                </Box>
              )}
              
              {/* Show My Account button when not signed in or still loading */}
              {(!isSignedIn || isLoading) && !userDisplayName && (
                <Button
                  color="inherit"
                  onClick={handleMenuClick}
                  data-guide="profile-menu"
                  endIcon={<ArrowDropDownIcon sx={{ color: '#374151' }} />}
                  startIcon={<AccountCircleIcon sx={{ color: '#f59e0b' }} />}
                  sx={{ 
                    textTransform: 'none', 
                    color: '#374151',
                    fontWeight: 500,
                    '&:hover': {
                      backgroundColor: 'rgba(245, 158, 11, 0.1)',
                      color: '#f59e0b'
                    }
                  }}
                  aria-label="Account menu"
                >
                  My Account
                </Button>
              )}
              <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleMenuClose}
                PaperProps={{
                  sx: {
                    ...menuStyles.paper,
                    backgroundColor: 'white',
                    minWidth: 200
                  }
                }}
                MenuListProps={{
                  sx: menuStyles.list
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                {/* User Info Header when signed in */}
                {isSignedIn && userDisplayName && (
                  <>
                    <Box sx={{ 
                      px: 2, 
                      py: 1.5, 
                      borderBottom: '1px solid #f0f0f0',
                      backgroundColor: '#f8f9fa'
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ 
                          bgcolor: '#f59e0b', 
                          color: '#ffffff',
                          width: 36, 
                          height: 36,
                          fontSize: '1rem',
                          fontWeight: 700
                        }}>
                          {userDisplayName.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ 
                            fontWeight: 600, 
                            color: '#333',
                            fontSize: '0.95rem'
                          }}>
                            {userDisplayName}
                          </Typography>
                          <Typography variant="caption" sx={{ 
                            color: '#666',
                            fontSize: '0.75rem'
                          }}>
                            @{userDisplayName.toLowerCase()}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                    <Divider sx={{ my: 0 }} />
                  </>
                )}
                {/* Show Profile and Settings only if signed in */}
                {isSignedIn && (
                  <>
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
                      <AccountCircleIcon sx={{ mr: 1.5, fontSize: 18, color: '#666' }} />
                      Profile
                    </MenuItem>
                    <Divider sx={{ my: 1 }} />
                  </>
                )}
                {!isSignedIn && (
                <MenuItem 
                  component={Link} 
                  to="/login" 
                  onClick={handleMenuClose}
                  data-guide="login-option"
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
                    data-guide="register-option"
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
                    disabled={isSigningOut}
                    sx={{
                      ...menuItemStyles.root,
                      color: isSigningOut ? '#999 !important' : '#d32f2f !important',
                      opacity: isSigningOut ? 0.6 : 1,
                      '&:hover': {
                        backgroundColor: isSigningOut ? 'transparent !important' : '#ffebee !important',
                      },
                      cursor: isSigningOut ? 'not-allowed' : 'pointer'
                    }}
                  >
                    <Box component="span" sx={{ 
                      display: 'inline-block',
                      width: 18,
                      height: 18,
                      mr: 1.5,
                      '&::before': {
                        content: isSigningOut ? '"⟳"' : '"↗"',
                        transform: isSigningOut ? 'none' : 'rotate(180deg)',
                        display: 'inline-block',
                        animation: isSigningOut ? 'spin 1s linear infinite' : 'none'
                      }
                    }} />
                    {isSigningOut ? 'Signing Out...' : 'Sign Out'}
                  </MenuItem>
                )}
              </Menu>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>
      
      <ModernBanner />

      {/* Sign out message notification */}
      {signOutMessage && (
        <Box
          sx={{
            position: 'fixed',
            top: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            animation: 'slideInDown 0.3s ease-out',
          }}
        >
          <Alert 
            severity="success" 
            sx={{ 
              width: 'fit-content',
              fontWeight: 600,
              fontSize: '0.95rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              border: '1px solid #4caf50'
            }}
          >
            {signOutMessage}
          </Alert>
        </Box>
      )}
      {signInMessage && (
        <Box
          sx={{
            position: 'fixed',
            top: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            animation: 'slideInDown 0.3s ease-out',
          }}
        >
          <Alert 
            severity="success" 
            sx={{ 
              width: 'fit-content',
              fontWeight: 600,
              fontSize: '0.95rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              border: '1px solid #4caf50'
            }}
          >
            {signInMessage}
          </Alert>
        </Box>
      )}
    </>
  );
});

Header.displayName = 'Header';

export default Header; 