import React from 'react';
import { Box, Typography, Paper, CircularProgress } from '@mui/material';
import { ActivityItem } from '../../types/dashboard';

interface RecentActivityFeedProps {
  activities: ActivityItem[];
  loading?: boolean;
}

const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({ activities, loading = false }) => {
  const getActivityColor = (type: ActivityItem['type']): string => {
    switch (type) {
      case 'trip_added':
        return 'rgb(26, 150, 152)';
      case 'comment_added':
        return '#f59e0b';
      case 'trip_updated':
        return '#6366f1';
      case 'booking_confirmed':
        return '#10b981';
      default:
        return '#6b7280';
    }
  };

  const getActivityIcon = (type: ActivityItem['type']): string => {
    switch (type) {
      case 'trip_added':
        return '✈️';
      case 'comment_added':
        return '💬';
      case 'trip_updated':
        return '📝';
      case 'booking_confirmed':
        return '✅';
      default:
        return '📋';
    }
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
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
          minHeight: '300px',
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
          Recent Activity
        </Typography>

        {activities.length === 0 ? (
          <Box
            sx={{
              textAlign: 'center',
              py: 4,
              color: '#6b7280'
            }}
          >
            <Typography variant="body2">
              No recent activity to show
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {activities.slice(0, 5).map((activity) => (
              <Box
                key={activity.id}
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 2,
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
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: getActivityColor(activity.type),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    flexShrink: 0,
                    mt: 0.5
                  }}
                >
                  {getActivityIcon(activity.type)}
                </Box>
                
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: '0.875rem',
                      color: '#1f2937',
                      fontWeight: 500,
                      mb: 0.5,
                      lineHeight: 1.4
                    }}
                  >
                    {activity.description}
                  </Typography>
                  
                  {activity.details && (
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '0.75rem',
                        color: '#6b7280',
                        display: 'block',
                        mb: 0.5
                      }}
                    >
                      {activity.details}
                    </Typography>
                  )}
                  
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '0.75rem',
                      color: '#9ca3af',
                      fontWeight: 400
                    }}
                  >
                    {formatTimestamp(activity.timestamp)}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default RecentActivityFeed;