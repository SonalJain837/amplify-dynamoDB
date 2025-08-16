import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  CircularProgress,
  Alert,
  Button,
  Snackbar,
  Fade,
  Grow,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProfileHeader from '../components/ProfileHeader';
import MyTrips from '../components/MyTrips';
import { getCurrentUser, signOut } from 'aws-amplify/auth';
import { generateClient } from 'aws-amplify/api';
import { type Schema } from '../../amplify/data/resource';
import { useNavigate } from 'react-router-dom';

// Styled components for modern layout
const ProfileContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)',
  display: 'flex',
  flexDirection: 'column',
}));

const ContentSection = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(6),
  flex: 1,
  maxWidth: '1400px !important', // Increased max width for better space utilization
  [theme.breakpoints.down('sm')]: {
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(4),
  },
}));

const TripsMainSection = styled(Paper)(({ theme }) => ({
  borderRadius: '16px',
  border: '1px solid rgba(0, 0, 0, 0.08)',
  background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)',
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
  },
}));

const Profile: React.FC = () => {
  const navigate = useNavigate();
  
  const [userData, setUserData] = useState<any>(null);
  const [trips, setTrips] = useState<Schema["Trips"]["type"][]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutMessage, setSignOutMessage] = useState<string | null>(null);


  useEffect(() => {
    const fetchUserDataAndTrips = async () => {
      setLoading(true);
      try {
        const currentUser = await getCurrentUser();
        const client = generateClient<Schema>();
        const email = currentUser.signInDetails?.loginId || currentUser.username;
        
        // Fetch user details
        let userDetails = null;
        try {
           userDetails = await client.models.Users.get({
             email: email || 'anonymous'
           });
        } catch (dbErr) {
           console.warn('Failed to fetch user by email', dbErr);
        }

        if (userDetails) {
          setUserData({ ...currentUser, ...userDetails });
        } else {
          setUserData(currentUser);
        }

        // Fetch user trips for statistics
        try {
          const tripsResult = await client.models.Trips.list({
            filter: {
              userEmail: { eq: email }
            }
          });

          if (tripsResult.data) {
            const sortedTrips = tripsResult.data.sort((a, b) => 
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            setTrips(sortedTrips);
          }
        } catch (tripsErr) {
          console.warn('Failed to fetch user trips for stats:', tripsErr);
        }
      } catch (err: any) {
           setError('Failed to retrieve user information.');
           console.error('Error fetching user data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDataAndTrips();
  }, []);

  // Calculate real stats from trips data
  const calculateStats = () => {
    if (!trips || trips.length === 0) {
      return {
        totalTrips: 0,
        upcomingTrips: 0,
        completedTrips: 0,
        departingToday: 0,
        thisMonthTrips: 0,
        avgTripsPerMonth: 0,
        favoriteDestination: undefined,
      };
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let upcomingTrips = 0;
    let completedTrips = 0;
    let thisMonthTrips = 0;
    let departingToday = 0;

    trips.forEach(trip => {
      if (trip.flightDate) {
        const tripDate = new Date(trip.flightDate);
        const tripDateOnly = new Date(tripDate.getFullYear(), tripDate.getMonth(), tripDate.getDate());
        
        // Count trips departing today
        if (tripDateOnly.getTime() === today.getTime()) {
          departingToday++;
        }
        // Count upcoming vs completed trips (excluding today's trips)
        else if (tripDate > now) {
          upcomingTrips++;
        } else {
          completedTrips++;
        }

        // Count this month's trips
        if (tripDate.getMonth() === currentMonth && tripDate.getFullYear() === currentYear) {
          thisMonthTrips++;
        }
      }
    });

    return {
      totalTrips: trips.length,
      upcomingTrips,
      completedTrips,
      departingToday,
      thisMonthTrips,
      avgTripsPerMonth: trips.length > 0 ? Math.round((trips.length / 12) * 10) / 10 : 0,
      favoriteDestination: undefined,
    };
  };

  const basicStats = calculateStats();

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      localStorage.clear();
      sessionStorage.clear();
      setSignOutMessage('Successfully signed out.');
      navigate('/');
    } catch (err) {
        console.error('Error signing out:', err);
    } finally {
      setIsSigningOut(false);
    }
  };


  if (loading) {
    return (
      <ProfileContainer>
        <Header />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
          <CircularProgress size={60} sx={{ color: '#f59e0b' }} />
        </Box>
        <Footer />
      </ProfileContainer>
    );
  }

  if (error && !userData) {
    return (
      <ProfileContainer>
        <Header />
        <ContentSection maxWidth="lg">
          <Alert severity="error" sx={{ mt: 4 }}>
            {error}
          </Alert>
        </ContentSection>
        <Footer />
      </ProfileContainer>
    );
  }

  return (
    <ProfileContainer>
      <Header />
      
      <ContentSection maxWidth="lg">
        {/* Error alert for partial data */}
        {error && userData && (
          <Fade in={true}>
            <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          </Fade>
        )}

        {/* Enhanced Profile Header Section */}
        <Grow in={true} timeout={800}>
          <Box sx={{ mb: 4 }}>
            <ProfileHeader
              user={{
                username: userData?.data?.username,
                firstName: userData?.data?.firstName,
                lastName: userData?.data?.lastName,
                email: userData?.signInDetails?.loginId || userData?.username,
                memberSince: userData?.createdAt,
              }}
              stats={basicStats}
            />
          </Box>
        </Grow>

        {/* Full-Width My Trips Section */}
        <Fade in={true} timeout={1000}>
          <TripsMainSection elevation={0}>
            <MyTrips />
          </TripsMainSection>
        </Fade>

        {/* Compact Account Actions */}
        <Fade in={true} timeout={1200}>
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'center',
              mt: 3,
              p: 3,
              borderRadius: 3,
              bgcolor: 'rgba(245, 158, 11, 0.05)',
              border: '1px solid rgba(245, 158, 11, 0.1)'
            }}
          >
            <Button
              onClick={handleSignOut}
              variant="text"
              color="error"
              disabled={isSigningOut}
              sx={{
                textTransform: 'none',
                fontWeight: 500,
                px: 3,
                py: 1,
                '&:hover': {
                  bgcolor: 'rgba(220, 53, 69, 0.05)',
                },
              }}
            >
              {isSigningOut ? (
                <>
                  <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} />
                  Signing Out...
                </>
              ) : (
                'Sign Out'
              )}
            </Button>
          </Box>
        </Fade>
      </ContentSection>

      <Footer />
      
      <Snackbar
        open={!!signOutMessage}
        autoHideDuration={3000}
        onClose={() => setSignOutMessage(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSignOutMessage(null)} 
          severity="success" 
          sx={{ 
            width: '100%',
            borderRadius: 2,
            fontWeight: 600,
          }}
        >
          {signOutMessage}
        </Alert>
      </Snackbar>
    </ProfileContainer>
  );
};

export default Profile;