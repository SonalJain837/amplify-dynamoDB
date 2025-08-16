import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  TextField, 
  Button, 
  Typography, 
  Box, 
  useTheme, 
  useMediaQuery, 
  Snackbar, 
  Alert,
  Paper,
  Container,
  InputAdornment,
  IconButton,
  Fade,
  CircularProgress
} from '@mui/material';
import { 
  Email as EmailIcon, 
  Lock as LockIcon, 
  Visibility, 
  VisibilityOff,
  FlightTakeoff as FlightIcon
} from '@mui/icons-material';
import Header from '../components/Header';
import { signIn } from 'aws-amplify/auth';
import Footer from '../components/Footer';

const validateEmail = (email: string) => {
  // Simple regex for xxx@xxx.xxx
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [touched, setTouched] = useState({ email: false, password: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (touched.email) {
      setEmailError(validateEmail(e.target.value) ? '' : 'Please enter a valid email address');
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (touched.password) {
      setPasswordError(e.target.value.length >= 8 ? '' : 'Password must be at least 8 characters');
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'email') {
      setTouched(t => ({ ...t, email: true }));
      setEmailError(validateEmail(value) ? '' : 'Please enter a valid email address');
    } else if (name === 'password') {
      setTouched(t => ({ ...t, password: true }));
      setPasswordError(value.length >= 8 ? '' : 'Password must be at least 8 characters');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    setTouched({ email: true, password: true });
    const validEmail = validateEmail(email);
    const validPassword = password.length >= 8;
    
    setEmailError(validEmail ? '' : 'Please enter a valid email address');
    setPasswordError(validPassword ? '' : 'Password must be at least 8 characters');
    
    if (!validEmail || !validPassword) {
      setSnackbar({ 
        open: true, 
        message: 'Please correct the errors below and try again', 
        severity: 'error' 
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      await signIn({ username: email, password });
      
      // Store user data immediately
      const tempUsername = email.split('@')[0];
      localStorage.setItem('username', tempUsername);
      localStorage.setItem('userEmail', email);
      localStorage.setItem('signInMessage', 'Welcome back! Successfully signed in.');
      
      // Navigate immediately without delay
      navigate('/');
        
    } catch (err: any) {
      // Show error on the sign-in page for invalid credentials
      if (err && (err.name === 'NotAuthorizedException' || err.name === 'UserNotFoundException')) {
        setSnackbar({ 
          open: true, 
          message: 'Invalid email or password. Please try again.', 
          severity: 'error' 
        });
      } else {
        setSnackbar({ 
          open: true, 
          message: err.message || 'Sign in failed. Please check your credentials and try again.', 
          severity: 'error' 
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ 
      width: '100%', 
      minHeight: '100vh',
      background: `linear-gradient(135deg, rgba(250, 250, 250, 0.95) 0%, rgba(255, 255, 255, 0.9) 100%),
        url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23e5e7eb' fill-opacity='0.1'%3E%3Cpath d='M50 50c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm20-20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm0 40c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm-40-20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      backgroundSize: '200px 200px',
      backgroundPosition: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <Header />
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ mt: 8 }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          variant="filled"
          sx={{ 
            width: '100%',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            borderRadius: 2
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
      
      <Container maxWidth="lg" sx={{ 
        display: 'flex', 
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 64px)',
        py: { xs: 3, sm: 4, md: 6 },
        px: { xs: 2, sm: 3 }
      }}>
        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', lg: 'row' },
          alignItems: 'center',
          gap: { xs: 4, lg: 8 },
          width: '100%',
          maxWidth: '1200px'
        }}>
          {/* Left side - Hero Section */}
          {!isSmallScreen && (
            <Fade in timeout={800}>
              <Box sx={{
                flex: { lg: '1 1 50%' },
                textAlign: { xs: 'center', lg: 'left' },
                color: '#1f2937',
                mb: { xs: 2, lg: 0 }
              }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: { xs: 'center', lg: 'flex-start' },
                  mb: 3
                }}>
                  <FlightIcon sx={{ 
                    fontSize: { xs: 40, md: 48 }, 
                    mr: 2,
                    color: '#f59e0b',
                    filter: 'drop-shadow(0 2px 4px rgba(245, 158, 11, 0.3))'
                  }} />
                  <Typography 
                    variant="h3" 
                    sx={{
                      fontWeight: 800,
                      fontSize: { xs: '2rem', md: '2.5rem' },
                      background: 'linear-gradient(45deg, #1f2937 30%, #f59e0b 90%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      textShadow: '0 1px 2px rgba(0,0,0,0.05)'
                    }}
                  >
                    Travel to World
                  </Typography>
                </Box>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    mb: 3, 
                    fontWeight: 300,
                    fontSize: { xs: '1.25rem', md: '1.5rem' },
                    lineHeight: 1.4,
                    color: '#4b5563'
                  }}
                >
                  Welcome back to your journey
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    fontSize: { xs: '1rem', md: '1.1rem' },
                    color: '#6b7280',
                    lineHeight: 1.6,
                    maxWidth: '500px',
                    mx: { xs: 'auto', lg: 0 }
                  }}
                >
                  Continue exploring amazing destinations, connect with fellow travelers, and create unforgettable memories around the globe.
                </Typography>
              </Box>
            </Fade>
          )}
          
          {/* Right side - Login Form */}
          <Fade in timeout={1000}>
            <Paper 
              elevation={24}
              sx={{
                flex: { lg: '0 0 480px' },
                width: '100%',
                maxWidth: '480px',
                borderRadius: 3,
                overflow: 'hidden',
                background: 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                boxShadow: '0 24px 48px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.1)'
              }}
            >
              <Box sx={{
                p: { xs: 3, sm: 4, md: 5 }
              }}>
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                  <Typography 
                    variant="h4" 
                    sx={{
                      fontWeight: 700,
                      fontSize: { xs: '1.75rem', sm: '2rem' },
                      color: '#1f2937',
                      mb: 1,
                      letterSpacing: '-0.025em'
                    }}
                  >
                    Welcome Back
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{
                      color: '#6b7280',
                      fontSize: '1rem',
                      fontWeight: 400
                    }}
                  >
                    Sign in to continue your journey
                  </Typography>
                </Box>
                
                <form onSubmit={handleSubmit} noValidate data-guide="login-form">
                  <Box mb={3}>
                    <TextField
                      fullWidth
                      required
                      id="email-address"
                      name="email"
                      label="Email Address"
                      placeholder="Enter your email"
                      value={email}
                      onChange={handleEmailChange}
                      onBlur={handleBlur}
                      error={!!emailError}
                      helperText={emailError || ' '}
                      variant="outlined"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailIcon sx={{ color: emailError ? '#ef4444' : '#9ca3af' }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: '#f9fafb',
                          borderRadius: 2,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: '#f3f4f6',
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#f59e0b',
                            }
                          },
                          '&.Mui-focused': {
                            backgroundColor: 'white',
                            boxShadow: '0 0 0 3px rgba(245, 158, 11, 0.1)',
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#f59e0b',
                              borderWidth: '2px'
                            }
                          },
                          '&.Mui-error': {
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#ef4444',
                            }
                          }
                        },
                        '& .MuiInputLabel-root': {
                          color: '#6b7280',
                          '&.Mui-focused': {
                            color: '#f59e0b'
                          }
                        },
                        '& .MuiFormHelperText-root': {
                          marginLeft: 0,
                          marginTop: 1,
                          fontSize: '0.875rem'
                        }
                      }}
                    />
                  </Box>
                  
                  <Box mb={4}>
                    <TextField
                      fullWidth
                      required
                      id="password"
                      name="password"
                      label="Password"
                      placeholder="Enter your password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={handlePasswordChange}
                      onBlur={handleBlur}
                      error={!!passwordError}
                      helperText={passwordError || ' '}
                      variant="outlined"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockIcon sx={{ color: passwordError ? '#ef4444' : '#9ca3af' }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle password visibility"
                              onClick={togglePasswordVisibility}
                              edge="end"
                              sx={{ color: '#9ca3af' }}
                            >
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: '#f9fafb',
                          borderRadius: 2,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: '#f3f4f6',
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#f59e0b',
                            }
                          },
                          '&.Mui-focused': {
                            backgroundColor: 'white',
                            boxShadow: '0 0 0 3px rgba(245, 158, 11, 0.1)',
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#f59e0b',
                              borderWidth: '2px'
                            }
                          },
                          '&.Mui-error': {
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#ef4444',
                            }
                          }
                        },
                        '& .MuiInputLabel-root': {
                          color: '#6b7280',
                          '&.Mui-focused': {
                            color: '#f59e0b'
                          }
                        },
                        '& .MuiFormHelperText-root': {
                          marginLeft: 0,
                          marginTop: 1,
                          fontSize: '0.875rem'
                        }
                      }}
                    />
                  </Box>
                  
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={isSubmitting}
                    sx={{
                      py: 1.75,
                      px: 4,
                      fontSize: '1rem',
                      fontWeight: 600,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)',
                      textTransform: 'none',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                        boxShadow: '0 6px 20px rgba(245, 158, 11, 0.5)',
                        transform: 'translateY(-2px)'
                      },
                      '&:active': {
                        transform: 'translateY(0px)'
                      },
                      '&.Mui-disabled': {
                        background: 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)',
                        boxShadow: 'none',
                        color: 'white'
                      }
                    }}
                  >
                    {isSubmitting ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CircularProgress size={20} sx={{ color: 'white' }} />
                        Signing in...
                      </Box>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                  
                  <Box sx={{ textAlign: 'center', mt: 4 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#6b7280',
                        fontSize: '0.95rem'
                      }}
                    >
                      Don't have an account?{' '}
                      <Link 
                        to="/register" 
                        style={{ 
                          color: '#f59e0b', 
                          fontWeight: 600, 
                          textDecoration: 'none',
                          transition: 'color 0.2s ease'
                        }}
                        onMouseOver={(e) => (e.target as HTMLElement).style.color = '#d97706'}
                        onMouseOut={(e) => (e.target as HTMLElement).style.color = '#f59e0b'}
                      >
                        Create account
                      </Link>
                    </Typography>
                  </Box>
                </form>
              </Box>
            </Paper>
          </Fade>
        </Box>
      </Container>
      
      <Footer />
    </Box>
  );
};

export default Login; 