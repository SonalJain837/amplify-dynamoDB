import React from 'react';
import { Box, Typography, Paper, CircularProgress, Chip } from '@mui/material';
import { FlightStatus } from '../../types/dashboard';

interface FlightStatusTrackerProps {
  flights: FlightStatus[];
  loading?: boolean;
}

const FlightStatusTracker: React.FC<FlightStatusTrackerProps> = ({ flights, loading = false }) => {
  const getStatusColor = (status: FlightStatus['status']): { backgroundColor: string; color: string } => {
    switch (status) {
      case 'on-time':
        return { backgroundColor: '#d1fae5', color: '#065f46' };
      case 'delayed':
        return { backgroundColor: '#fef3c7', color: '#92400e' };
      case 'cancelled':
        return { backgroundColor: '#fee2e2', color: '#991b1b' };
      case 'boarding':
        return { backgroundColor: '#dbeafe', color: '#1e40af' };
      case 'departed':
        return { backgroundColor: '#e0e7ff', color: '#3730a3' };
      default:
        return { backgroundColor: '#f3f4f6', color: '#374151' };
    }
  };

  const getStatusLabel = (status: FlightStatus['status']): string => {
    switch (status) {
      case 'on-time':
        return 'On Time';
      case 'delayed':
        return 'Delayed';
      case 'cancelled':
        return 'Cancelled';
      case 'boarding':
        return 'Boarding';
      case 'departed':
        return 'Departed';
      default:
        return 'Unknown';
    }
  };

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
          minHeight: '200px',
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
          Flight Status
        </Typography>

        {flights.length === 0 ? (
          <Box
            sx={{
              textAlign: 'center',
              py: 4,
              color: '#6b7280'
            }}
          >
            <Typography variant="body2">
              No upcoming flights to track
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {flights.slice(0, 3).map((flight, index) => (
              <Box
                key={`${flight.flightNumber}-${index}`}
                sx={{
                  p: 3,
                  borderRadius: '8px',
                  border: '1px solid #f3f4f6',
                  background: '#fafbfc',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: '#f8fafc',
                    borderColor: '#e5e7eb',
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: '#1f2937'
                      }}
                    >
                      {flight.airline} {flight.flightNumber}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '0.75rem',
                        color: '#6b7280'
                      }}
                    >
                      {flight.departure.date}
                    </Typography>
                  </Box>
                  <Chip
                    label={getStatusLabel(flight.status)}
                    size="small"
                    sx={{
                      ...getStatusColor(flight.status),
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      height: '24px'
                    }}
                  />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: '#1f2937',
                        mb: 0.5
                      }}
                    >
                      {flight.departure.city}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        display: 'block'
                      }}
                    >
                      {flight.departure.airport}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '0.75rem',
                        color: '#1f2937',
                        fontWeight: 600
                      }}
                    >
                      {flight.departure.time}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      px: 2,
                      color: '#9ca3af'
                    }}
                  >
                    <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                      ✈️
                    </Typography>
                  </Box>

                  <Box sx={{ flex: 1, textAlign: 'right' }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: '#1f2937',
                        mb: 0.5
                      }}
                    >
                      {flight.arrival.city}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        display: 'block'
                      }}
                    >
                      {flight.arrival.airport}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '0.75rem',
                        color: '#1f2937',
                        fontWeight: 600
                      }}
                    >
                      {flight.arrival.time}
                    </Typography>
                  </Box>
                </Box>

                {(flight.gate || flight.terminal) && (
                  <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid #f3f4f6' }}>
                    <Box sx={{ display: 'flex', gap: 3 }}>
                      {flight.terminal && (
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: '0.75rem',
                            color: '#6b7280'
                          }}
                        >
                          Terminal: <span style={{ fontWeight: 600, color: '#1f2937' }}>{flight.terminal}</span>
                        </Typography>
                      )}
                      {flight.gate && (
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: '0.75rem',
                            color: '#6b7280'
                          }}
                        >
                          Gate: <span style={{ fontWeight: 600, color: '#1f2937' }}>{flight.gate}</span>
                        </Typography>
                      )}
                    </Box>
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default FlightStatusTracker;