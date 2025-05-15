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
  Container,
  Stack,
} from '@mui/material';
import Header from '../components/Header';

const ageRanges = [
  '18-25',
  '26-35',
  '36-45',
  '46-55',
  '56+',
];

const employerSizes = [
  '1-10',
  '11-50',
  '51-200',
  '201-500',
  '501-1000',
  '1000+',
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
    employerSize: '1-10',
    termsAgreed: false,
    captchaChecked: false,
    zipCode: '',
    profession: '',
    ageRange: '',
  });
  const [errors, setErrors] = useState<any>({});
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [alertContent, setAlertContent] = useState<{ severity: 'error' | 'success' | 'info'; message: string } | null>(null);

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
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const validate = () => {
    const newErrors: any = {};
    if (!validateUserName(formData.userName)) {
      newErrors.userName = 'Please enter unique user name between 4 to 14 characters.';
    }
    if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter valid email address.';
    }
    if (!validateName(formData.firstName)) {
      newErrors.firstName = 'No numbers or special characters allowed.';
    }
    if (!validateName(formData.lastName)) {
      newErrors.lastName = 'No numbers or special characters allowed.';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required.';
    }
    if (!validatePasswordMatch(formData.password, formData.confirmPassword)) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }
    if (!formData.termsAgreed) {
      newErrors.termsAgreed = 'You must agree to the Terms of Use.';
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validate();
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    // Simulate success/failure
    if (formData.email === 'fail@fail.com') {
      setAlertContent({ severity: 'error', message: 'failed to create account' });
      setOpenSnackbar(true);
    } else {
      setAlertContent({ severity: 'success', message: `Check for a link in ${formData.email} email` });
      setOpenSnackbar(true);
      setTimeout(() => {
        setAlertContent(null);
        navigate('/login');
      }, 2500);
    }
  };

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', bgcolor: '#f5f8fa' }}>
      <Header />
      <Container maxWidth="md" sx={{ py: 3, mt: 2 }}>
        <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2 }}>
          <Typography variant="h5" align="center" fontWeight="bold" sx={{ mb: 2 }}>
            Create your account
          </Typography>
          
          <form onSubmit={handleSubmit} noValidate>
            <Stack spacing={2}>
              {/* Basic info - first row */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <TextField
                  sx={{ flex: 1, minWidth: '240px' }}
                  required
                  id="username"
                  name="userName"
                  label="Username*"
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
                  id="email-address"
                  name="email"
                  label="Email Address*"
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
              
              {/* Name fields row */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <TextField
                  sx={{ flex: 1, minWidth: '240px' }}
                  required
                  id="firstName"
                  name="firstName"
                  label="First Name*"
                  value={formData.firstName}
                  onChange={handleTextFieldChange}
                  onBlur={handleBlur}
                  error={!!errors.firstName}
                  helperText={errors.firstName}
                  variant="outlined"
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  FormHelperTextProps={{ style: { color: '#a94442', marginLeft: 0 } }}
                  inputProps={{ maxLength: 50 }}
                />
                
                <TextField
                  sx={{ flex: 1, minWidth: '240px' }}
                  required
                  id="lastName"
                  name="lastName"
                  label="Last Name*"
                  value={formData.lastName}
                  onChange={handleTextFieldChange}
                  onBlur={handleBlur}
                  error={!!errors.lastName}
                  helperText={errors.lastName}
                  variant="outlined"
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  FormHelperTextProps={{ style: { color: '#a94442', marginLeft: 0 } }}
                  inputProps={{ maxLength: 50 }}
                />
              </Box>
              
              {/* Password row */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <TextField
                  sx={{ flex: 1, minWidth: '240px' }}
                  required
                  id="password"
                  name="password"
                  label="Password*"
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
                  id="confirm-password"
                  name="confirmPassword"
                  label="Confirm Password*"
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
              
              {/* Dropdowns row */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <FormControl sx={{ flex: 1, minWidth: '240px' }} size="small">
                  <InputLabel id="nationality-label" shrink>Nationality*</InputLabel>
                  <Select
                    labelId="nationality-label"
                    name="nationality"
                    value={formData.nationality}
                    label="Nationality*"
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
              
              {/* Additional fields row */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <TextField
                  sx={{ flex: 1, minWidth: '240px' }}
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleTextFieldChange}
                  size="small"
                  label="Zip/Postal Code*"
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                />
                
                <TextField
                  sx={{ flex: 1, minWidth: '240px' }}
                  name="profession"
                  value={formData.profession}
                  onChange={handleTextFieldChange}
                  size="small"
                  label="Profession"
                  variant="outlined"
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
              
              {/* Employer size */}
              <FormControl sx={{ maxWidth: '50%' }} size="small">
                <InputLabel id="employer-size-label" shrink>Employer Size</InputLabel>
                <Select
                  labelId="employer-size-label"
                  name="employerSize"
                  value={formData.employerSize}
                  label="Employer Size"
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
                  {employerSizes.map((size) => (
                    <MenuItem 
                      key={size} 
                      value={size}
                      sx={menuItemStyles.root}
                    >
                      {size}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              {/* reCAPTCHA */}
              <Box sx={{ border: '1px solid #eee', p: 1.5, width: 'fit-content' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <FormControlLabel
                    control={
                      <Checkbox 
                        name="captchaChecked" 
                        checked={formData.captchaChecked}
                        onChange={handleCheckboxChange}
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
              </Box>
              
              {/* Terms */}
              <Box sx={{ width: 'fit-content' }}>
                <FormControlLabel 
                  control={
                    <Checkbox 
                      name="termsAgreed" 
                      checked={formData.termsAgreed}
                      onChange={handleCheckboxChange}
                      size="small"
                    />
                  } 
                  label={
                    <Typography variant="body2">
                      I agree to the 
                      <Link to="/terms" style={{ color: 'rgb(26, 150, 152)', marginLeft: 5 }}>
                        Terms of Use
                      </Link>
                    </Typography>
                  }
                />
                {errors.termsAgreed && (
                  <Typography color="error" variant="caption" sx={{ display: 'block', ml: 2 }}>
                    {errors.termsAgreed}
                  </Typography>
                )}
              </Box>
              
              {/* Action buttons */}
              <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Link to="/login" style={{ color: 'rgb(26, 150, 152)', fontWeight: 500, textDecoration: 'none' }}>
                  Already have an account? Sign in
                </Link>
                
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button 
                    variant="outlined" 
                    color="inherit" 
                    onClick={() => navigate('/login')}
                    size="medium"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    sx={{ fontWeight: 'bold', bgcolor: 'rgb(26, 150, 152)' }}
                    size="medium"
                  >
                    Register
                  </Button>
                </Box>
              </Box>
            </Stack>
          </form>
        </Paper>
      </Container>
      
      {/* Alert notification */}
      {openSnackbar && alertContent && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
          }}
        >
          <Alert
            severity={alertContent.severity}
            onClose={() => setOpenSnackbar(false)}
            variant="filled"
            sx={{ minWidth: '300px' }}
          >
            {alertContent.message}
          </Alert>
        </Box>
      )}
    </Box>
  );
} 