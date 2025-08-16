import React from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import { QuickAction } from '../../types/dashboard';

interface QuickActionButtonsProps {
  actions: QuickAction[];
}

const QuickActionButtons: React.FC<QuickActionButtonsProps> = ({ actions }) => {
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
          Quick Actions
        </Typography>

        <Box 
          sx={{ 
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 2
          }}
        >
          {actions.map((action) => (
            <Button
              key={action.id}
              variant="outlined"
              onClick={action.action}
              sx={{
                borderColor: action.color,
                color: action.color,
                borderRadius: '8px',
                p: 2,
                textTransform: 'none',
                fontSize: '0.875rem',
                fontWeight: 500,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                textAlign: 'left',
                minHeight: '80px',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: `${action.color}08`,
                  borderColor: action.color,
                  transform: 'translateY(-1px)',
                  boxShadow: `0 4px 12px ${action.color}20`,
                },
                '&:active': {
                  transform: 'translateY(0)',
                }
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  mb: 0.5
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'inherit'
                  }}
                >
                  {action.title}
                </Typography>
                {action.count !== undefined && (
                  <Box
                    sx={{
                      backgroundColor: action.color,
                      color: 'white',
                      borderRadius: '12px',
                      px: 1.5,
                      py: 0.25,
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      minWidth: '24px',
                      textAlign: 'center'
                    }}
                  >
                    {action.count}
                  </Box>
                )}
              </Box>
              
              <Typography
                variant="body2"
                sx={{
                  fontSize: '0.75rem',
                  color: '#6b7280',
                  lineHeight: 1.4,
                  textAlign: 'left'
                }}
              >
                {action.description}
              </Typography>
            </Button>
          ))}
        </Box>
      </Box>
    </Paper>
  );
};

export default QuickActionButtons;