import React from 'react';
import { Box, Typography, Paper, CircularProgress } from '@mui/material';
import { TripStats } from '../../types/dashboard';

interface QuickStatsCardProps {
  stats: TripStats | null;
  loading?: boolean;
}

const QuickStatsCard: React.FC<QuickStatsCardProps> = ({ stats, loading = false }) => {
  const statsData = [
    {
      value: stats?.totalTrips || 0,
      label: 'Total Trips',
      color: 'rgb(26, 150, 152)',
      description: 'Trips planned'
    },
    {
      value: stats?.upcomingFlights || 0,
      label: 'Upcoming Flights',
      color: '#f59e0b',
      description: 'Next 30 days'
    },
    {
      value: stats?.countriesVisited || 0,
      label: 'Countries Visited',
      color: '#6366f1',
      description: 'Destinations explored'
    }
  ];

  if (loading) {
    return (
      <Paper
        elevation={0}
        sx={{
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          background: '#ffffff',
          p: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '160px',
        }}
      >
        <CircularProgress size={32} sx={{ color: 'rgb(26, 150, 152)' }} />
      </Paper>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: '12px',
        border: '1px solid #e5e7eb',
        background: '#ffffff',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        transition: 'box-shadow 0.2s ease',
        '&:hover': {
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        }
      }}
    >
      <Box sx={{ p: 3 }}>
        <Typography
          variant="h6"
          sx={{
            fontSize: '1.125rem',
            fontWeight: 600,
            color: '#1f2937',
            mb: 3
          }}
        >
          Travel Overview
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 3 }}>
          {statsData.map((stat, index) => (
            <Box
              key={stat.label}
              sx={{
                flex: 1,
                textAlign: 'center',
                position: 'relative',
                '&:not(:last-child)::after': {
                  content: '""',
                  position: 'absolute',
                  right: { xs: 'auto', sm: '-12px' },
                  bottom: { xs: '-12px', sm: 'auto' },
                  left: { xs: 0, sm: 'auto' },
                  top: { xs: 'auto', sm: 0 },
                  width: { xs: '100%', sm: '1px' },
                  height: { xs: '1px', sm: '100%' },
                  backgroundColor: '#e5e7eb',
                  display: { xs: index === statsData.length - 1 ? 'none' : 'block', sm: 'block' }
                }
              }}
            >
              <Typography
                variant="h3"
                sx={{
                  fontSize: '2rem',
                  fontWeight: 700,
                  color: stat.color,
                  mb: 0.5,
                  lineHeight: 1.2
                }}
              >
                {stat.value}
              </Typography>
              <Typography
                variant="subtitle1"
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#1f2937',
                  mb: 0.5
                }}
              >
                {stat.label}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontSize: '0.75rem',
                  color: '#6b7280',
                  fontWeight: 400
                }}
              >
                {stat.description}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Paper>
  );
};

export default QuickStatsCard;