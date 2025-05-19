import React from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
} from '@mui/material';
import Header from '../components/Header';
import Footer from '../components/Footer';

const TermsPage: React.FC = () => {
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
            Terms of Use
          </Typography>

          <Box>
            <Typography variant="body1" paragraph>
              Website Terms of Use manage the use of a website by visitors. These are distinct from terms and conditions of business which are concerned with the e-commerce aspects of selling goods or services online, rather than the way in which a website is used. Any businesses with an online presence must include certain details in order to abide by the Electronic Commerce Regulations. Website terms and conditions are the best place to include such information.
            </Typography>
            <Typography variant="body1" paragraph>
              Ensuring that your users understand the limitations of how they can use any website content, including text, images, videos and music, helps to secure your intellectual property.
            </Typography>
            <Typography variant="body1" paragraph>
              If you don't have a clue on how to make terms of use for your website, we can help you out. Just fill in the spaces below and we will send you an email with your very own terms of use for your website.
            </Typography>
            <Typography variant="body1" sx={{ color: 'error.main', fontWeight: 'medium' }}>
              The accuracy of the generated document on this website is not legally binding. Use at your own risk.
            </Typography>
          </Box>
        </Paper>
      </Container>

      <Footer />
    </Box>
  );
};

export default TermsPage; 