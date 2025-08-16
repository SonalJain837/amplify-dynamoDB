import React, { useState } from 'react';
import { Box, Container, Typography, Snackbar, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PreviousTrips from '../components/PreviousTrips';
import Header from '../components/Header';
import Footer from '../components/Footer';
import TravelChatModal from '../components/TravelChatModal';
import { useUser } from '../contexts/UserContext';

const PreviousTripsPage = () => {
  const navigate = useNavigate();
  const { userData } = useUser();
  const { userEmail } = userData;
  const [openMessageModal, setOpenMessageModal] = useState(false);
  const [selectedTravelerData, setSelectedTravelerData] = useState<any>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Handle contact traveler
  const handleContactTraveler = (travelerData: any) => {
    if (!userData.isSignedIn || !userEmail) {
      setSuccessMessage('⚠️ Please sign in or register first to contact a traveler');
      return;
    }
    setSelectedTravelerData(travelerData);
    setOpenMessageModal(true);
  };

  // Handle closing the message modal
  const handleCloseMessageModal = () => {
    setOpenMessageModal(false);
    setSelectedTravelerData(null);
  };

  // Handle message sent callback from modal
  const handleMessageSent = (success: boolean, message: string) => {
    setSuccessMessage(message);
    if (success) {
      // Optionally close modal after successful send
      // handleCloseMessageModal();
    }
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        bgcolor: '#ffffff',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Header />
      
      {/* Modern Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(241, 245, 249, 0.9) 100%)',
          py: { xs: 3, sm: 4, md: 5 },
          px: { xs: 2, sm: 3, md: 4 },
          borderRadius: '0 0 40px 40px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `radial-gradient(circle at 30% 20%, rgba(245, 158, 11, 0.1) 0%, transparent 50%),
                         radial-gradient(circle at 70% 80%, rgba(59, 130, 246, 0.08) 0%, transparent 50%)`,
            zIndex: 1,
          }
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
            <Typography 
              variant="h2" 
              sx={{ 
                fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.75rem' },
                fontWeight: 800,
                background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                mb: 1.5
              }}
            >
              Previous Travel Details
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                color: '#6b7280',
                fontSize: { xs: '0.95rem', sm: '1.05rem' },
                maxWidth: '600px',
                mx: 'auto',
                lineHeight: 1.6
              }}
            >
              View your past travel adventures and connections
            </Typography>
          </Box>
        </Container>
      </Box>
      
      {/* Main Content */}
      <Box 
        component="main"
        sx={{ 
          flex: 1,
          width: '100%', 
          padding: { xs: 1.5, sm: 2, md: 3 },
          maxWidth: '1400px',
          mx: 'auto'
        }}
      >
        <PreviousTrips onClose={() => navigate('/')} onContactTraveler={handleContactTraveler} />
      </Box>
      
      <Footer />

      {/* Travel Chat Modal */}
      <TravelChatModal
        open={openMessageModal}
        onClose={handleCloseMessageModal}
        travelerData={selectedTravelerData ? {
          userEmail: selectedTravelerData.userEmail || selectedTravelerData.email,
          ownerName: selectedTravelerData.ownerName || selectedTravelerData.name || selectedTravelerData.userEmail?.split('@')[0],
          firstName: selectedTravelerData.firstName,
          lastName: selectedTravelerData.lastName,
          from: selectedTravelerData.from || selectedTravelerData.fromCity,
          to: selectedTravelerData.to || selectedTravelerData.toCity,
          date: selectedTravelerData.date || selectedTravelerData.flightDate,
          flight: selectedTravelerData.flight || selectedTravelerData.flightDetails,
          tripId: selectedTravelerData.tripId || selectedTravelerData.id
        } : null}
        currentUserEmail={userEmail || ''}
        onMessageSent={handleMessageSent}
      />

      {/* Snackbar for success/error messages */}
      <Snackbar
        open={successMessage !== null}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSuccessMessage(null)} 
          severity={successMessage?.includes('⚠️') ? 'error' : 'success'}
          sx={{
            width: '100%',
            backgroundColor: successMessage?.includes('⚠️') ? '#ffebee' : undefined,
            '& .MuiAlert-icon': {
              color: successMessage?.includes('⚠️') ? '#d32f2f' : undefined,
            },
            '& .MuiAlert-message': {
              color: successMessage?.includes('⚠️') ? '#d32f2f' : undefined,
              fontWeight: successMessage?.includes('⚠️') ? 'bold' : undefined,
            }
          }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PreviousTripsPage; 