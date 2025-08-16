import React from 'react';
import { Box, Typography, Paper, CircularProgress, Chip, Button } from '@mui/material';
import { BookingSummary } from '../../types/dashboard';

interface BookingSummaryWidgetProps {
  bookingData: BookingSummary | null;
  loading?: boolean;
  onViewAllBookings?: () => void;
}

const BookingSummaryWidget: React.FC<BookingSummaryWidgetProps> = ({ 
  bookingData, 
  loading = false, 
  onViewAllBookings 
}) => {
  const getStatusColor = (status: 'confirmed' | 'pending' | 'cancelled'): { backgroundColor: string; color: string } => {
    switch (status) {
      case 'confirmed':
        return { backgroundColor: '#d1fae5', color: '#065f46' };
      case 'pending':
        return { backgroundColor: '#fef3c7', color: '#92400e' };
      case 'cancelled':
        return { backgroundColor: '#fee2e2', color: '#991b1b' };
      default:
        return { backgroundColor: '#f3f4f6', color: '#374151' };
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
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
          minHeight: '250px',
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
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography
            variant="h6"
            sx={{
              fontSize: '1.125rem',
              fontWeight: 600,
              color: '#1f2937'
            }}
          >
            Booking Summary
          </Typography>
          {onViewAllBookings && (
            <Button
              variant="text"
              size="small"
              onClick={onViewAllBookings}
              sx={{
                color: 'rgb(26, 150, 152)',
                fontSize: '0.75rem',
                textTransform: 'none',
                p: 0,
                minWidth: 'auto'
              }}
            >
              View All
            </Button>
          )}
        </Box>

        {!bookingData ? (
          <Box
            sx={{
              textAlign: 'center',
              py: 4,
              color: '#6b7280'
            }}
          >
            <Typography variant="body2">
              No booking data available
            </Typography>
          </Box>
        ) : (
          <>
            {/* Summary Stats */}
            <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
              <Box sx={{ flex: 1, textAlign: 'center' }}>
                <Typography
                  variant="h4"
                  sx={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    color: 'rgb(26, 150, 152)',
                    mb: 0.5
                  }}
                >
                  {bookingData.pendingBookings}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    fontWeight: 500
                  }}
                >
                  Pending
                </Typography>
              </Box>
              
              <Box
                sx={{
                  width: '1px',
                  backgroundColor: '#e5e7eb'
                }}
              />
              
              <Box sx={{ flex: 1, textAlign: 'center' }}>
                <Typography
                  variant="h4"
                  sx={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    color: '#10b981',
                    mb: 0.5
                  }}
                >
                  {bookingData.completedTrips}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    fontWeight: 500
                  }}
                >
                  Completed
                </Typography>
              </Box>
            </Box>

            {/* Upcoming Trips */}
            {bookingData.upcomingTrips.length > 0 && (
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: '#6b7280',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    mb: 2,
                    display: 'block'
                  }}
                >
                  Upcoming Trips
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {bookingData.upcomingTrips.slice(0, 3).map((trip) => (
                    <Box
                      key={trip.id}
                      sx={{
                        p: 2,
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
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: '#1f2937'
                          }}
                        >
                          {trip.destination}
                        </Typography>
                        <Chip
                          label={trip.status}
                          size="small"
                          sx={{
                            ...getStatusColor(trip.status),
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            height: '20px',
                            textTransform: 'capitalize'
                          }}
                        />
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: '0.75rem',
                            color: '#6b7280'
                          }}
                        >
                          Departure: <span style={{ fontWeight: 600, color: '#1f2937' }}>{formatDate(trip.departureDate)}</span>
                        </Typography>
                        {trip.returnDate && (
                          <Typography
                            variant="caption"
                            sx={{
                              fontSize: '0.75rem',
                              color: '#6b7280'
                            }}
                          >
                            Return: <span style={{ fontWeight: 600, color: '#1f2937' }}>{formatDate(trip.returnDate)}</span>
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}

            {/* Total Spent (if available) */}
            {bookingData.totalSpent !== undefined && (
              <Box
                sx={{
                  mt: 3,
                  pt: 3,
                  borderTop: '1px solid #f3f4f6',
                  textAlign: 'center'
                }}
              >
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    display: 'block',
                    mb: 0.5
                  }}
                >
                  Total Travel Budget
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    fontSize: '1.25rem',
                    fontWeight: 600,
                    color: '#1f2937'
                  }}
                >
                  ${bookingData.totalSpent.toLocaleString()}
                </Typography>
              </Box>
            )}
          </>
        )}
      </Box>
    </Paper>
  );
};

export default BookingSummaryWidget;