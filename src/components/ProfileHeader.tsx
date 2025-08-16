import React from 'react';
import {
  Box,
  Typography,
  Avatar,
  Paper,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  Flight as FlightIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

interface ProfileHeaderProps {
  user: {
    username?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    memberSince?: string;
  };
  stats: {
    totalTrips: number;
    upcomingTrips: number;
    completedTrips: number;
    departingToday: number;
  };
}

// Styled components following the design system
const HeroSection = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #5B9B9F 100%)',
  borderRadius: '16px',
  overflow: 'hidden',
  position: 'relative',
  marginBottom: theme.spacing(4),
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    zIndex: 1,
  },
}));

const ProfileAvatar = styled(Avatar)(({ theme }) => ({
  width: 120,
  height: 120,
  background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
  color: '#f59e0b',
  fontSize: '2.5rem',
  fontWeight: 700,
  border: '4px solid rgba(255, 255, 255, 0.3)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
  position: 'relative',
  zIndex: 2,
  [theme.breakpoints.down('sm')]: {
    width: 80,
    height: 80,
    fontSize: '2rem',
  },
}));

const StatsCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2, 3),
  borderRadius: '12px',
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  transition: 'all 0.3s ease',
  position: 'relative',
  zIndex: 2,
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.1)',
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1.5, 2),
  },
}));

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  user,
  stats,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const displayName = user.firstName && user.lastName 
    ? `${user.firstName} ${user.lastName}`
    : user.username || 'Travel Enthusiast';

  const getInitials = () => {
    if (user.firstName && user.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;
    }
    return user.username?.charAt(0)?.toUpperCase() || 'T';
  };


  return (
    <HeroSection>
      <Box 
        sx={{ 
          p: { xs: 3, sm: 4, md: 6 },
          position: 'relative',
          zIndex: 2,
        }}
      >
        {/* Enhanced Horizontal Layout: User Info Left, Stats Right */}
        <Box 
          sx={{ 
            display: 'flex',
            flexDirection: { xs: 'column', lg: 'row' },
            alignItems: { xs: 'center', lg: 'flex-start' },
            justifyContent: 'space-between',
            gap: { xs: 4, lg: 6 },
            mb: { xs: 3, lg: 4 },
          }}
        >
          {/* Left Section: Avatar and User Info */}
          <Box 
            sx={{ 
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'center', sm: 'flex-start' },
              gap: { xs: 3, sm: 4 },
              flex: { lg: 1 },
              textAlign: { xs: 'center', sm: 'left', lg: 'left' },
              color: 'white',
            }}
          >
            {/* Avatar */}
            <ProfileAvatar>
              {getInitials()}
            </ProfileAvatar>

            {/* User Details */}
            <Box sx={{ flex: 1 }}>
              <Box sx={{ mb: 2 }}>
                <Typography 
                  variant={isMobile ? 'h4' : 'h3'}
                  sx={{ 
                    fontWeight: 700,
                    mb: 0.5,
                    fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.5rem' },
                    lineHeight: 1.2,
                  }}
                >
                  {displayName}
                </Typography>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    opacity: 0.9,
                    fontWeight: 500,
                    fontSize: { xs: '1rem', sm: '1.125rem' },
                  }}
                >
                  @{user.username || 'traveler'}
                </Typography>
              </Box>


              {/* Email */}
              <Typography 
                variant="body1" 
                sx={{ 
                  opacity: 0.8,
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  mb: { xs: 2, lg: 0 },
                }}
              >
                {user.email}
              </Typography>

            </Box>
          </Box>

          {/* Right Section: Trip Statistics */}
          <Box 
            sx={{ 
              display: { xs: 'none', lg: 'flex' },
              gap: 3,
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <StatsCard elevation={0} sx={{ minWidth: 140 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                  }}
                >
                  <FlightIcon sx={{ color: 'white', fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      fontWeight: 700,
                      color: '#2C3E50',
                      fontSize: '1.5rem',
                    }}
                  >
                    {stats.totalTrips}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: '#6C757D',
                      fontWeight: 500,
                    }}
                  >
                    Total Trips
                  </Typography>
                </Box>
              </Box>
            </StatsCard>

            <StatsCard elevation={0} sx={{ minWidth: 140 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #5B9B9F 0%, #4A8B8F 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(91, 155, 159, 0.3)',
                  }}
                >
                  <CalendarIcon sx={{ color: 'white', fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      fontWeight: 700,
                      color: '#2C3E50',
                      fontSize: '1.5rem',
                    }}
                  >
                    {stats.upcomingTrips}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: '#6C757D',
                      fontWeight: 500,
                    }}
                  >
                    Upcoming
                  </Typography>
                </Box>
              </Box>
            </StatsCard>

            <StatsCard elevation={0} sx={{ minWidth: 140 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #28A745 0%, #1E7E34 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(40, 167, 69, 0.3)',
                  }}
                >
                  <Typography sx={{ fontSize: '20px' }}>✅</Typography>
                </Box>
                <Box>
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      fontWeight: 700,
                      color: '#2C3E50',
                      fontSize: '1.5rem',
                    }}
                  >
                    {stats.completedTrips}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: '#6C757D',
                      fontWeight: 500,
                    }}
                  >
                    Completed
                  </Typography>
                </Box>
              </Box>
            </StatsCard>

            <StatsCard elevation={0} sx={{ minWidth: 140 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #DC3545 0%, #C82333 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(220, 53, 69, 0.3)',
                  }}
                >
                  <Typography sx={{ fontSize: '20px' }}>🛫</Typography>
                </Box>
                <Box>
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      fontWeight: 700,
                      color: '#2C3E50',
                      fontSize: '1.5rem',
                    }}
                  >
                    {stats.departingToday}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: '#6C757D',
                      fontWeight: 500,
                    }}
                  >
                    Departing Today
                  </Typography>
                </Box>
              </Box>
            </StatsCard>
          </Box>
        </Box>

        {/* Mobile/Tablet Stats Section - Only show when desktop stats are hidden */}
        <Box 
          sx={{ 
            display: { xs: 'grid', lg: 'none' },
            gridTemplateColumns: { 
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(4, 1fr)',
            },
            gap: { xs: 2, sm: 3 },
          }}
        >
          <StatsCard elevation={0}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                }}
              >
                <FlightIcon sx={{ color: 'white', fontSize: 24 }} />
              </Box>
              <Box>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 700,
                    color: '#2C3E50',
                    fontSize: { xs: '1.5rem', sm: '2rem' },
                  }}
                >
                  {stats.totalTrips}
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#6C757D',
                    fontWeight: 500,
                  }}
                >
                  Total Trips
                </Typography>
              </Box>
            </Box>
          </StatsCard>

          <StatsCard elevation={0}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #5B9B9F 0%, #4A8B8F 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(91, 155, 159, 0.3)',
                }}
              >
                <CalendarIcon sx={{ color: 'white', fontSize: 24 }} />
              </Box>
              <Box>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 700,
                    color: '#2C3E50',
                    fontSize: { xs: '1.5rem', sm: '2rem' },
                  }}
                >
                  {stats.upcomingTrips}
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#6C757D',
                    fontWeight: 500,
                  }}
                >
                  Upcoming
                </Typography>
              </Box>
            </Box>
          </StatsCard>

          <StatsCard elevation={0}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #28A745 0%, #1E7E34 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(40, 167, 69, 0.3)',
                }}
              >
                <Typography sx={{ color: 'white', fontSize: 24 }}>✅</Typography>
              </Box>
              <Box>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 700,
                    color: '#2C3E50',
                    fontSize: { xs: '1.5rem', sm: '2rem' },
                  }}
                >
                  {stats.completedTrips}
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#6C757D',
                    fontWeight: 500,
                  }}
                >
                  Completed
                </Typography>
              </Box>
            </Box>
          </StatsCard>

          <StatsCard elevation={0}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #DC3545 0%, #C82333 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(220, 53, 69, 0.3)',
                }}
              >
                <Typography sx={{ color: 'white', fontSize: 24 }}>🛫</Typography>
              </Box>
              <Box>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 700,
                    color: '#2C3E50',
                    fontSize: { xs: '1.5rem', sm: '2rem' },
                  }}
                >
                  {stats.departingToday}
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#6C757D',
                    fontWeight: 500,
                  }}
                >
                  Departing Today
                </Typography>
              </Box>
            </Box>
          </StatsCard>
        </Box>
      </Box>
    </HeroSection>
  );
};

export default ProfileHeader;