import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { getCurrentUser, signOut } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';
import { type Schema } from '../../amplify/data/resource';
import { useNavigate } from 'react-router-dom';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const currentUser = await getCurrentUser();
        const client = generateClient<Schema>();
        
        // Attempt to fetch user details from your database using username as ID
        // or fallback to userId if schema supports it
        let userDetails = null;
        try {
           // Assuming username can be used as an identifier in your schema
           userDetails = await client.models.Users.get({
             email: currentUser.username
           });
        } catch (dbErr) {
           console.warn('Failed to fetch user by email, trying userId', dbErr);
           try {
             // If schema uses userId as the key
              userDetails = await client.models.Users.get({
                email: currentUser.userId
              });
           } catch (userIdErr) {
              console.error('Failed to fetch user by userId', userIdErr);
           }
        }

        if (userDetails) {
          setUserData({ ...currentUser, ...userDetails }); // Combine Cognito user info with DB details
        } else {
          // If database fetch fails, use available info from Cognito user
          setUserData(currentUser);
          setError('Failed to fetch full user details from database. Showing basic info.');
        }
      } catch (err: any) {
           // If getting current user fails completely
           setError('Failed to retrieve user information.');
           console.error('Error fetching user data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Use username for display if firstName and lastName are not available
  const displayName = userData?.firstName && userData?.lastName 
    ? `${userData.firstName} ${userData.lastName}`
    : userData?.username || 'User';

  // Modify handleSignOut function to use isSigningOut state
  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      localStorage.clear();
      sessionStorage.clear();
      navigate('/'); // Navigate to home after sign out
    } catch (err) {
        console.error('Error signing out:', err);
    } finally {
      setIsSigningOut(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !userData) { // Only show fatal error if no user data at all
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: '#f5f8fa'
    }}>
      <Header />
      
      <Container maxWidth="lg" sx={{ py: 4, flex: 1 }}>
        {/* Main Content Area - User Info */}
        <Grid container spacing={4}> 
          <Box sx={{ width: '100%' }}>
             {/* Error alert for partial data */}
             {error && userData && (
                <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>
             )}
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}> 
                Contact info
              </Typography>

              <Paper 
                elevation={3}
                sx={{ 
                  p: { xs: 2, sm: 4 },
                  borderRadius: 2,
                  bgcolor: 'white'
                }}
              >
                 <Typography variant="h6" component="h3" sx={{ fontWeight: 600, mb: 2 }}>
                   Account
                 </Typography>

                 <Box sx={{ mb: 2 }}>
                   <Typography variant="subtitle1" color="text.secondary">
                     User ID
                   </Typography>
                   <Typography variant="body1">
                     {userData?.username || 'Not provided'}
                   </Typography>
                 </Box>

                 <Box sx={{ mb: 2 }}>
                   <Typography variant="subtitle1" color="text.secondary">
                     Name
                   </Typography>
                   <Typography variant="body1">
                     {displayName}
                   </Typography>
                 </Box>

                 <Box sx={{ mb: 2 }}>
                   <Typography variant="subtitle1" color="text.secondary">
                     Email
                   </Typography>
                   <Typography variant="body1">
                     {userData?.email || 'Not provided'}
                   </Typography>
                 </Box>

                 <Box sx={{ mt: 4 }}>
                    <Button
                      onClick={handleSignOut}
                      variant="text"
                      color="error"
                      disabled={isSigningOut}
                      sx={{ 
                        textTransform: 'none', 
                        padding: 0,
                        minWidth: 'unset',
                        '&:hover': { textDecoration: 'underline', bgcolor: 'transparent' } 
                      }}
                    >
                       {isSigningOut ? <CircularProgress size={16} color="inherit" /> : 'Sign Out'}
                    </Button>
                 </Box>
              </Paper>
               {/* Add more sections here as needed */}
            </Box>
          </Box>
        </Grid>
      </Container>

      <Footer />
    </Box>
  );
};

export default Profile;