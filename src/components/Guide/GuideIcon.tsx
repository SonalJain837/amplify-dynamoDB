import React from 'react';
import { IconButton, Tooltip, Box } from '@mui/material';
import { HelpOutline as HelpIcon, Refresh as RestartIcon } from '@mui/icons-material';
import { useGuide } from '../../hooks/useGuide';

export const GuideIcon: React.FC = () => {
  const { startGuide, state, resetGuide } = useGuide();

  const handleStartGuide = () => {
    // Always allow guide to start, regardless of completion status
    if (state.isActive) {
      // If guide is already active, restart it
      resetGuide();
      setTimeout(() => startGuide(), 100);
    } else {
      startGuide();
    }
  };

  const isDisabled = false; // Never disable - always allow restart
  const showRestartIcon = state.isCompleted && !state.isActive;

  return (
    <Tooltip 
      title={
        state.isActive 
          ? "Restart guide" 
          : state.isCompleted 
            ? "Restart interactive guide" 
            : "Start interactive guide"
      } 
      placement="bottom"
    >
      <IconButton
        onClick={handleStartGuide}
        disabled={isDisabled}
        data-guide="guide-trigger"
        sx={{
          color: 'inherit',
          ml: 1,
          width: { xs: 36, sm: 40 },
          height: { xs: 36, sm: 40 },
          borderRadius: '12px',
          background: state.isActive 
            ? 'rgba(245, 158, 11, 0.3)' 
            : showRestartIcon
              ? 'rgba(34, 197, 94, 0.1)'
              : 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.1) 100%)',
          backdropFilter: 'blur(10px)',
          border: `1px solid ${state.isActive ? '#f59e0b' : showRestartIcon ? '#22c55e' : 'rgba(245, 158, 11, 0.2)'}`,
          transition: 'all 0.3s ease',
          '&:hover': {
            background: state.isActive 
              ? 'rgba(245, 158, 11, 0.4)'
              : showRestartIcon
                ? 'rgba(34, 197, 94, 0.2)'
                : 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.2) 100%)',
            transform: 'translateY(-1px)',
            boxShadow: state.isActive 
              ? '0 4px 12px rgba(245, 158, 11, 0.4)'
              : showRestartIcon
                ? '0 4px 12px rgba(34, 197, 94, 0.3)'
                : '0 4px 12px rgba(245, 158, 11, 0.3)',
          },
          '&:active': {
            transform: 'translateY(0)',
          }
        }}
      >
        {showRestartIcon ? (
          <RestartIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
        ) : (
          <HelpIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
        )}
        
        {/* Pulsing indicator when guide is not active and not completed */}
        {!state.isActive && !state.isCompleted && (
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: '#f59e0b',
              animation: 'pulse 2s infinite',
              '@keyframes pulse': {
                '0%': {
                  boxShadow: '0 0 0 0 rgba(245, 158, 11, 0.7)'
                },
                '70%': {
                  boxShadow: '0 0 0 6px rgba(245, 158, 11, 0)'
                },
                '100%': {
                  boxShadow: '0 0 0 0 rgba(245, 158, 11, 0)'
                }
              }
            }}
          />
        )}

        {/* Completion indicator */}
        {!state.isActive && state.isCompleted && (
          <Box
            sx={{
              position: 'absolute',
              top: -2,
              right: -2,
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: '#22c55e',
              border: '2px solid white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '8px',
              color: 'white',
              fontWeight: 'bold'
            }}
          >
            ✓
          </Box>
        )}
      </IconButton>
    </Tooltip>
  );
};