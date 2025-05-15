import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TextField, Button, Typography, Box, useTheme, useMediaQuery, Snackbar, Alert } from '@mui/material';
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
  const [touched, setTouched] = useState({ email: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (touched.email) {
      setEmailError(validateEmail(e.target.value) ? '' : 'Please enter valid email address.');
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (e.target.name === 'email') {
      setTouched(t => ({ ...t, email: true }));
      setEmailError(validateEmail(email) ? '' : 'Please enter valid email address.');
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true });
    const validEmail = validateEmail(email);
    const validPassword = password.length > 0;
    setEmailError(validEmail ? '' : 'Please enter valid email address.');
    if (!validEmail || !validPassword) {
      setSnackbar({ open: true, message: 'Please enter valid email and password.', severity: 'error' });
      return;
    }
    setIsSubmitting(true);
    try {
      await signIn({ username: email, password });
      setSnackbar({ open: true, message: 'Sign in successful!', severity: 'success' });
      setTimeout(() => {
        setSnackbar({ open: false, message: '', severity: 'success' });
        navigate('/');
      }, 1500);
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Sign in failed. Please check your credentials.', severity: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', bgcolor: '#f5f8fa' }}>
      <Header />
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
      <Box sx={{ 
        display: 'flex', 
        width: '100%', 
        height: 'calc(100vh - 64px)',
        overflow: 'hidden'
      }}>
        {/* Split layout with flex container */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' },
          width: '100%',
          height: '100%'
        }}>
          {/* Left side - Hero Image */}
          {!isMobile && (
            <Box sx={{ 
              flex: { md: '0 0 60%', lg: '0 0 65%' },
              position: 'relative',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              backgroundColor: '#f5f5f5',
              '&::before': {
                content: 'none'
              }
            }}>
              <Box 
                component="img"
                src="/image.png"
                alt="Login Image"
                sx={{
                  width: 'calc(100% - 60px)',
                  height: 'calc(100% - 60px)',
                  objectFit: 'cover',
                  objectPosition: 'center',
                  transition: 'transform 30s ease',
                  margin: '30px',
                  borderRadius: '8px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  '&:hover': {
                    transform: 'scale(1.05)'
                  }
                }}
              />
            </Box>
          )}
          {/* Right side - Login Form */}
          <Box sx={{ 
            flex: { xs: '1', md: '0 0 40%', lg: '0 0 35%' },
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center',
            bgcolor: 'white',
            padding: { xs: 2, sm: 4 }
          }}>
            <Box sx={{ 
              maxWidth: 450, 
              width: '100%', 
              mx: 'auto',
              p: { xs: 2, sm: 3 }
            }}>
              <Typography variant="h4" fontWeight="bold" sx={{ mb: 4 }}>
                Sign in to your account
              </Typography>
              <form onSubmit={handleSubmit} noValidate>
                <Box mb={3}>
                  <TextField
                    fullWidth
                    required
                    id="email-address"
                    name="email"
                    label="Email Address*"
                    value={email}
                    onChange={handleEmailChange}
                    onBlur={handleBlur}
                    error={!!emailError}
                    helperText={emailError}
                    variant="outlined"
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    FormHelperTextProps={{ style: { color: '#a94442', marginLeft: 0 } }}
                  />
                </Box>
                <Box mb={4}>
                  <TextField
                    fullWidth
                    required
                    id="password"
                    name="password"
                    label="Password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    variant="outlined"
                    size="small"
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  color="primary"
                  sx={{ 
                    fontWeight: 'bold', 
                    py: 1.2, 
                    bgcolor: 'rgb(26, 150, 152)',
                    '&:hover': {
                      bgcolor: 'rgb(21, 120, 120)',
                    }
                  }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Signing in...' : 'Sign in'}
                </Button>
                <Box className="text-sm text-center" mt={3}>
                  <Link to="/register" style={{ color: 'rgb(26, 150, 152)', fontWeight: 500 }}>
                    Don't have an account? Register here
                  </Link>
                </Box>
              </form>
            </Box>
          </Box>
        </Box>
      </Box>
      <Footer />
    </Box>
  );
};

export default Login; 