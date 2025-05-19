import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Snackbar,
  Alert,
  CircularProgress
} from '@mui/material';
import Header from '../components/Header';
import Footer from '../components/Footer';

const ContactUs: React.FC = () => {
  const [formData, setFormData] = useState({
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Here you would typically send the message to your backend
      // For now, we'll just simulate a successful submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSnackbar({
        open: true,
        message: 'Your message has been sent successfully!',
        severity: 'success'
      });
      
      // Clear form
      setFormData({
        subject: '',
        message: ''
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to send message. Please try again.',
        severity: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: '#f5f8fa'
    }}>
      <Header />
      
      <Container maxWidth="md" sx={{ py: 4, flex: 1 }}>
        <Paper 
          elevation={3}
          sx={{ 
            p: { xs: 2, sm: 4 },
            borderRadius: 2,
            bgcolor: 'white'
          }}
        >
          <Typography 
            variant="h4" 
            component="h1" 
            align="center" 
            gutterBottom
            sx={{ 
              color: '#2c3e50',
              fontWeight: 600,
              mb: 4
            }}
          >
            Contact Us
          </Typography>

          <Typography 
            variant="body1" 
            align="center" 
            sx={{ 
              color: '#666',
              mb: 4,
              maxWidth: '600px',
              mx: 'auto'
            }}
          >
            Have a question or feedback? We'd love to hear from you. Fill out the form below and we'll get back to you as soon as possible.
          </Typography>

          <form onSubmit={handleSubmit}>
            <Box sx={{ maxWidth: '600px', mx: 'auto' }}>
              <TextField
                fullWidth
                required
                label="Subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                variant="outlined"
                sx={{ mb: 3 }}
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                fullWidth
                required
                label="Message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                variant="outlined"
                multiline
                rows={6}
                sx={{ mb: 4 }}
                InputLabelProps={{ shrink: true }}
              />

              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={isSubmitting}
                  sx={{
                    bgcolor: 'rgb(26, 150, 152)',
                    '&:hover': {
                      bgcolor: 'rgb(21, 120, 120)',
                    },
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem'
                  }}
                >
                  {isSubmitting ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'Send Message'
                  )}
                </Button>
              </Box>
            </Box>
          </form>
        </Paper>
      </Container>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Footer />
    </Box>
  );
};

export default ContactUs; 