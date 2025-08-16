import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  TextField,
  Button,
  Typography,
  Box,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Alert,
  Paper,
  SelectChangeEvent,
  Checkbox,
  FormControlLabel,
  Stack,
  CircularProgress,
  Snackbar,
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import Header from '../components/Header';
import { signUp, confirmSignUp, resendSignUpCode } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';
import { v4 as uuidv4 } from 'uuid';
import { type Schema } from '../../amplify/data/resource';
import Footer from '../components/Footer';
import TermsModal from '../components/TermsModal';

const ageRanges = [
  '18-25',
  '26-35',
  '36-45',
  '46-55',
  '56+',
];


const countries = [
  'Other',
  'United States',
  'United Kingdom',
  'China',
  'India',
  'Japan',
  'South Korea',
  'Indonesia',
  'Pakistan',
  'Bangladesh',
  'Philippines',
  'Vietnam',
  'Thailand',
];

const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validateUserName = (name: string) => name.length >= 4 && name.length <= 14;
const validateName = (name: string) => /^[A-Za-z]{1,50}$/.test(name);
const validatePassword = (password: string) => password.length >= 8 && password.length <= 24;
const validatePasswordMatch = (password: string, confirmPassword: string) => password === confirmPassword;

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

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    userName: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    company: '',
    nationality: '',
    termsAgreed: false,
    captchaChecked: false,
    ageRange: '',
  });
  const [errors, setErrors] = useState<any>({});
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [alertContent, setAlertContent] = useState<{ severity: 'error' | 'success' | 'info'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [openTermsModal, setOpenTermsModal] = useState(false);

  const handleOpenTermsModal = () => {
    setOpenTermsModal(true);
  };

  const handleCloseTermsModal = () => {
    setOpenTermsModal(false);
  };

  const handleTextFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors((prev: any) => ({ ...prev, [name]: '' }));
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name as string]: value }));
    setErrors((prev: any) => ({ ...prev, [name as string]: '' }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    if (name === "termsAgreed") {
      setFormData(prev => ({ ...prev, termsAgreed: checked }));
      setErrors((prev: any) => ({ ...prev, termsAgreed: '' }));
    } else if (name === "captchaChecked") {
      setFormData(prev => ({ ...prev, captchaChecked: checked }));
    }
  };

  const validate = () => {
    const newErrors: any = {};
    if (!validateUserName(formData.userName)) {
      newErrors.userName = 'Please enter unique user name between 4 to 14 characters.';
    }
    if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter valid email address.';
    }
    if (!validatePassword(formData.password)) {
      newErrors.password = 'Password must be between 8 and 24 characters.';
    }
    if (!validatePasswordMatch(formData.password, formData.confirmPassword)) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }
    if (!formData.termsAgreed) {
      newErrors.termsAgreed = 'You must agree to the Terms of Use.';
    }
    if (!validateName(formData.firstName)) {
      newErrors.firstName = 'No numbers or special characters allowed.';
    }
    if (!validateName(formData.lastName)) {
      newErrors.lastName = 'No numbers or special characters allowed.';
    }
    if (!formData.captchaChecked) {
      newErrors.captchaChecked = 'Please confirm you are not a robot.';
    }
    return newErrors;
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name } = e.target;
    const newErrors = validate();
    if (newErrors[name]) {
      setErrors((prev: any) => ({ ...prev, [name]: newErrors[name] }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validate();
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    setIsSubmitting(true);
    try {
      // Cognito sign up
      await signUp({
        username: formData.email,
        password: formData.password,
        options: {
          userAttributes: {
            email: formData.email,
            given_name: formData.firstName,
            family_name: formData.lastName,
          },
        },
      });

      setAlertContent({ severity: 'success', message: `A verification code has been sent to ${formData.email}. Please check your inbox.` });
      setOpenSnackbar(true);
      setIsConfirming(true); // Move to confirmation step
    } catch (error: any) {
      setAlertContent({ severity: 'error', message: error.message || 'Failed to create account. Please try again.' });
      setOpenSnackbar(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await confirmSignUp({ username: formData.email, confirmationCode });
      // DynamoDB user creation after successful confirmation
      const client = generateClient<Schema>();
      await client.models.Users.create({
        username: formData.userName,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        ageRange: formData.ageRange || undefined,
        nationality: formData.nationality || undefined,
        createdAt: new Date().toISOString(),
        userId: uuidv4(),
      });

      setAlertContent({ severity: 'success', message: 'Account confirmed successfully! You can now sign in.' });
      setOpenSnackbar(true);
      setTimeout(() => {
        setAlertContent(null);
        navigate('/login'); // Redirect to login page after successful confirmation
      }, 2500);
    } catch (error: any) {
      setAlertContent({ severity: 'error', message: error.message || 'Failed to confirm account. Please check the code and try again.' });
      setOpenSnackbar(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    try {
      await resendSignUpCode({ username: formData.email });
      setAlertContent({ severity: 'info', message: 'A new verification code has been sent.' });
      setOpenSnackbar(true);
    } catch (error: any) {
      setAlertContent({ severity: 'error', message: error.message || 'Failed to resend code.' });
      setOpenSnackbar(true);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: '#f5f8fa' }}>
      <Header />
      <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', py: { xs: 2, md: 4 } }}>
        <Paper elevation={3} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2, maxWidth: 600, width: '100%', bgcolor: 'white' }}>
          <Typography variant="h4" component="h1" sx={{ mb: 2, textAlign: 'center', fontWeight: 600, color: '#2c3e50' }}>
            Create your account
          </Typography>
          
          {/* Privacy Notice */}
          <Box sx={{ 
            mb: 3, 
            p: 2, 
            bgcolor: '#f8f9fa', 
            border: '1px solid #e9ecef',
            borderRadius: 1,
            borderLeft: '4px solid #1A9698'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <InfoIcon sx={{ 
                color: '#1A9698', 
                fontSize: '1.1rem', 
                mt: 0.1,
                flexShrink: 0 
              }} />
              <Typography variant="body2" sx={{ 
                color: '#6c757d', 
                fontSize: '0.875rem',
                lineHeight: 1.5,
                fontWeight: 400
              }}>
                Your email address will remain confidential and will not be disclosed, displayed, or shared with any other users. Only your user ID will be visible to other users.
              </Typography>
            </Box>
          </Box>
          {!isConfirming ? (
            <form onSubmit={handleSubmit} noValidate data-guide="registration-form">
              <Stack spacing={2}>
                {/* Username and Email Address */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  <TextField
                    sx={{ flex: 1, minWidth: '240px' }}
                    required
                    id="username"
                    name="userName"
                    label="Username"
                    value={formData.userName}
                    onChange={handleTextFieldChange}
                    onBlur={handleBlur}
                    error={!!errors.userName}
                    helperText={errors.userName}
                    variant="outlined"
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    FormHelperTextProps={{ style: { color: '#a94442', marginLeft: 0 } }}
                  />
                  <TextField
                    sx={{ flex: 1, minWidth: '240px' }}
                    required
                    id="email"
                    name="email"
                    label="Email Address"
                    value={formData.email}
                    onChange={handleTextFieldChange}
                    onBlur={handleBlur}
                    error={!!errors.email}
                    helperText={errors.email}
                    variant="outlined"
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    FormHelperTextProps={{ style: { color: '#a94442', marginLeft: 0 } }}
                  />
                </Box>

                {/* First Name and Last Name */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  <TextField
                    sx={{ flex: 1, minWidth: '240px' }}
                    required
                    id="firstName"
                    name="firstName"
                    label="First Name"
                    value={formData.firstName}
                    onChange={handleTextFieldChange}
                    onBlur={handleBlur}
                    error={!!errors.firstName}
                    helperText={errors.firstName}
                    variant="outlined"
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    FormHelperTextProps={{ style: { color: '#a94442', marginLeft: 0 } }}
                  />
                  <TextField
                    sx={{ flex: 1, minWidth: '240px' }}
                    required
                    id="lastName"
                    name="lastName"
                    label="Last Name"
                    value={formData.lastName}
                    onChange={handleTextFieldChange}
                    onBlur={handleBlur}
                    error={!!errors.lastName}
                    helperText={errors.lastName}
                    variant="outlined"
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    FormHelperTextProps={{ style: { color: '#a94442', marginLeft: 0 } }}
                  />
                </Box>

                {/* Password and Confirm Password */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  <TextField
                    sx={{ flex: 1, minWidth: '240px' }}
                    required
                    id="password"
                    name="password"
                    label="Password"
                    type="password"
                    value={formData.password}
                    onChange={handleTextFieldChange}
                    onBlur={handleBlur}
                    error={!!errors.password}
                    helperText={errors.password}
                    variant="outlined"
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    FormHelperTextProps={{ style: { color: '#a94442', marginLeft: 0 } }}
                  />
                  <TextField
                    sx={{ flex: 1, minWidth: '240px' }}
                    required
                    id="confirmPassword"
                    name="confirmPassword"
                    label="Confirm Password"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleTextFieldChange}
                    onBlur={handleBlur}
                    error={!!errors.confirmPassword}
                    helperText={errors.confirmPassword}
                    variant="outlined"
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    FormHelperTextProps={{ style: { color: '#a94442', marginLeft: 0 } }}
                  />
                </Box>

                {/* Nationality and Age Range */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  <FormControl sx={{ flex: 1, minWidth: '240px' }} size="small">
                    <InputLabel id="nationality-label" shrink>Nationality</InputLabel>
                    <Select
                      labelId="nationality-label"
                      name="nationality"
                      value={formData.nationality}
                      label="Nationality"
                      onChange={handleSelectChange}
                      MenuProps={{
                        PaperProps: {
                          sx: menuStyles.paper
                        },
                        MenuListProps: {
                          sx: menuStyles.list
                        }
                      }}
                      sx={{
                        bgcolor: 'white',
                        '& .MuiSelect-select': {
                          color: '#333'
                        }
                      }}
                    >
                      {countries.map((country) => (
                        <MenuItem 
                          key={country} 
                          value={country}
                          sx={menuItemStyles.root}
                        >
                          {country}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <FormControl sx={{ flex: 1, minWidth: '240px' }} size="small">
                    <InputLabel id="age-range-label" shrink>Age Range</InputLabel>
                    <Select
                      labelId="age-range-label"
                      name="ageRange"
                      value={formData.ageRange}
                      label="Age Range"
                      onChange={handleSelectChange}
                      MenuProps={{
                        PaperProps: {
                          sx: menuStyles.paper
                        },
                        MenuListProps: {
                          sx: menuStyles.list
                        }
                      }}
                      sx={{
                        bgcolor: 'white',
                        '& .MuiSelect-select': {
                          color: '#333'
                        }
                      }}
                    >
                      {ageRanges.map((range) => (
                        <MenuItem 
                          key={range} 
                          value={range}
                          sx={menuItemStyles.root}
                        >
                          {range}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                

                {/* Captcha */}
                <Box sx={{ border: '1px solid #eee', p: 1.5, width: 'fit-content' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <FormControlLabel
                      control={
                        <Checkbox 
                          name="captchaChecked" 
                          checked={formData.captchaChecked}
                          onChange={handleCheckboxChange}
                          color="primary"
                        />
                      }
                      label="I'm not a robot"
                    />
                    <Box component="span" sx={{ display: 'inline-block', ml: 2 }}>
                      <img 
                        src="https://www.gstatic.com/recaptcha/api2/logo_48.png" 
                        alt="reCAPTCHA" 
                        width={30} 
                        height={30}
                      />
                    </Box>
                  </Box>
                  {errors.captchaChecked && (
                    <Typography color="error" variant="caption" sx={{ display: 'block', ml: 2 }}>
                      {errors.captchaChecked}
                    </Typography>
                  )}
                </Box>
                
                {/* Terms */}
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-start' }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.termsAgreed}
                        onChange={handleCheckboxChange}
                        name="termsAgreed"
                        color="primary"
                      />
                    }
                    label={
                      <Typography variant="body2">
                        I agree to the <Typography component="span" onClick={handleOpenTermsModal} sx={{ textDecoration: 'underline', color: '#1A9698', fontWeight: 500, cursor: 'pointer' }}>Terms of Use</Typography>
                      </Typography>
                    }
                  />
                  {errors.termsAgreed && (
                    <Typography color="error" variant="caption" sx={{ ml: 4 }}>
                      {errors.termsAgreed}
                    </Typography>
                  )}
                </Box>
              </Stack>
              
              {/* Action buttons */}
              <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2 }}>
                <Link to="/login" style={{ textDecoration: 'none' }}>
                  <Button 
                    variant="outlined" 
                    color="inherit" 
                    sx={{ fontWeight: 'bold', color: '#2c3e50', borderColor: '#ccc', '&:hover': { borderColor: '#aaa' } }}
                  >
                    Cancel
                  </Button>
                </Link>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  sx={{ fontWeight: 'bold', bgcolor: '#1A9698', '&:hover': { bgcolor: '#167a7c' } }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Register'}
                </Button>
              </Box>
              <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
                Already have an account? <Link to="/login" style={{ color: '#1A9698', textDecoration: 'none', fontWeight: 500 }}>Sign in</Link>
              </Typography>
            </form>
          ) : (
            <form onSubmit={handleConfirmSignUp} noValidate>
              <Typography variant="body1" sx={{ mb: 2, textAlign: 'center' }}>
                Please enter the verification code sent to your email address ({formData.email})
              </Typography>
              <TextField
                fullWidth
                required
                id="confirmationCode"
                name="confirmationCode"
                label="Verification Code"
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value)}
                variant="outlined"
                size="small"
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 2 }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                sx={{ mt: 1, py: 1.5, fontWeight: 'bold', bgcolor: '#1A9698', '&:hover': { bgcolor: '#167a7c' } }}
                disabled={isSubmitting}
              >
                {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Confirm Account'}
              </Button>
              <Button
                fullWidth
                variant="text"
                onClick={handleResendCode}
                disabled={isSubmitting}
                sx={{ mt: 1, color: '#1A9698' }}
              >
                Resend Code
              </Button>
            </form>
          )}
        </Paper>
      </Box>
      <Footer />
      <TermsModal open={openTermsModal} onClose={handleCloseTermsModal} />
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setOpenSnackbar(false)} severity={alertContent?.severity} sx={{ width: '100%' }}>
          {alertContent?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
} 