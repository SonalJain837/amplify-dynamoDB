import React, { memo, useState, useCallback, useEffect } from 'react';
import {
  Fab,
  Tooltip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Divider,
  IconButton,
} from '@mui/material';
import {
  HelpOutline as HelpIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Message as MessageIcon,
  Person as PersonIcon,
  PlayArrow as PlayArrowIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useUser } from '../../contexts/UserContext';
import { useGuide } from '../../hooks/useGuide';

interface SimpleGuideOption {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  condition?: () => boolean;
}

const SimpleInteractiveGuide: React.FC = memo(() => {
  const { userData } = useUser();
  const { startGuide } = useGuide();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const isOpen = Boolean(anchorEl);

  // Smooth scroll function with better compatibility and DataGrid support
  const smoothScrollToElement = useCallback((selector: string, offset: number = 0) => {
    let element = document.querySelector(selector);
    
    // Special handling for DataGrid elements
    if (selector.includes('travel-details')) {
      element = document.querySelector('[data-guide="travel-details"]') || 
                document.querySelector('.MuiDataGrid-root') ||
                element;
    }
    
    if (element) {
      const elementRect = element.getBoundingClientRect();
      const absoluteElementTop = elementRect.top + window.pageYOffset;
      const middle = absoluteElementTop - (window.innerHeight / 3) + offset;
      
      // Use smooth scrolling with better positioning
      window.scrollTo({
        top: Math.max(0, middle),
        behavior: 'smooth'
      });
      
      return element;
    }
    return null;
  }, []);

  // Enhanced highlight function with better visibility and DataGrid support
  const highlightElement = useCallback((selector: string, duration: number = 5000) => {
    const element = smoothScrollToElement(selector, 50);
    if (element) {
      // Wait for scroll to complete before highlighting
      setTimeout(() => {
        const originalStyle = element.getAttribute('style') || '';
        const originalTransition = (element as HTMLElement).style.transition;
        const originalTransform = (element as HTMLElement).style.transform;
        
        // Special handling for DataGrid to make it more visible
        let highlightStyles = `
          outline: 4px solid #f59e0b !important;
          outline-offset: 4px !important;
          border-radius: 8px !important;
          box-shadow: 0 0 30px rgba(245, 158, 11, 0.8) !important;
          background-color: rgba(245, 158, 11, 0.15) !important;
          transition: all 0.3s ease !important;
          position: relative !important;
          z-index: 1000 !important;
        `;

        // Enhanced styles for DataGrid elements
        if (element.classList.contains('MuiDataGrid-root') || selector.includes('travel-details')) {
          highlightStyles += `
            border: 3px solid #f59e0b !important;
            transform: scale(1.01) !important;
          `;
        }
        
        // Apply highlight with animation
        (element as HTMLElement).style.cssText += highlightStyles;

        // Add pulsing effect with better visibility
        let pulseCount = 0;
        const pulseInterval = setInterval(() => {
          if (pulseCount >= 8) {
            clearInterval(pulseInterval);
            return;
          }
          
          const scale = pulseCount % 2 === 0 ? '1.015' : '1.005';
          const shadow = pulseCount % 2 === 0 ? 
            '0 0 40px rgba(245, 158, 11, 1)' : 
            '0 0 20px rgba(245, 158, 11, 0.6)';
          
          (element as HTMLElement).style.transform = `scale(${scale})`;
          (element as HTMLElement).style.boxShadow = shadow + ' !important';
          pulseCount++;
        }, 400);

        // Show a tooltip-like message
        const tooltip = document.createElement('div');
        tooltip.innerHTML = `
          <div style="
            position: absolute;
            top: -50px;
            left: 50%;
            transform: translateX(-50%);
            background: #f59e0b;
            color: white;
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            white-space: nowrap;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: fadeInOut 4s ease-in-out;
          ">
            👆 This is what you can interact with!
          </div>
        `;
        (element as HTMLElement).style.position = 'relative';
        element.appendChild(tooltip.firstElementChild as Element);

        // Remove highlight and tooltip after duration
        setTimeout(() => {
          (element as HTMLElement).style.cssText = originalStyle;
          (element as HTMLElement).style.transition = originalTransition;
          (element as HTMLElement).style.transform = originalTransform;
          clearInterval(pulseInterval);
          
          // Remove tooltip
          const tooltipElement = element.querySelector('div[style*="This is what you can interact with"]');
          if (tooltipElement) {
            tooltipElement.remove();
          }
        }, duration);
      }, 1000); // Wait for scroll animation
    }
  }, [smoothScrollToElement]);

  // Simplified guide options with clearer descriptions
  const guideOptions: SimpleGuideOption[] = [
    {
      id: 'start-tour',
      label: '🎯 Take a Quick Tour',
      description: 'Step-by-step walkthrough of the website',
      icon: <PlayArrowIcon />,
      action: () => {
        handleClose();
        const flowId = userData.isSignedIn ? 'authenticated-onboarding' : 'unauthenticated-onboarding';
        startGuide(flowId);
      },
    },
    {
      id: 'show-search',
      label: '🔍 Search for Travelers',
      description: 'Find people going to your destination',
      icon: <SearchIcon />,
      action: () => {
        handleClose();
        highlightElement('[data-guide="search-input"]');
      },
    },
    {
      id: 'show-add-trip',
      label: '✈️ Share Your Trip',
      description: 'Let others know about your travel plans',
      icon: <AddIcon />,
      action: () => {
        handleClose();
        highlightElement('[data-guide="add-trip-button"]');
      },
      condition: () => userData.isSignedIn,
    },
    {
      id: 'show-trips',
      label: '📋 View All Trips',
      description: 'Browse trips from other travelers',
      icon: <InfoIcon />,
      action: () => {
        handleClose();
        highlightElement('[data-guide="travel-details"]');
      },
    },
    {
      id: 'show-messages',
      label: '💬 My Messages',
      description: 'Chat with other travelers',
      icon: <MessageIcon />,
      action: () => {
        handleClose();
        if (window.location.pathname !== '/messages') {
          highlightElement('a[href="/messages"]');
        } else {
          highlightElement('[data-guide="message-list"]');
        }
      },
      condition: () => userData.isSignedIn,
    },
    {
      id: 'show-profile',
      label: '👤 My Profile',
      description: 'Manage your account settings',
      icon: <PersonIcon />,
      action: () => {
        handleClose();
        highlightElement('[data-guide="profile-menu"]');
      },
    },
  ];

  const handleOpen = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  // Filter options based on conditions
  const availableOptions = guideOptions.filter(option => 
    !option.condition || option.condition()
  );

  return (
    <>
      {/* CSS for animations */}
      <style>
        {`
          @keyframes fadeInOut {
            0% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
            20% { opacity: 1; transform: translateX(-50%) translateY(0px); }
            80% { opacity: 1; transform: translateX(-50%) translateY(0px); }
            100% { opacity: 0; transform: translateX(-50%) translateY(-10px); }
          }
          @keyframes helpButtonPulse {
            0% { box-shadow: 0 4px 20px rgba(245, 158, 11, 0.4); }
            50% { box-shadow: 0 6px 30px rgba(245, 158, 11, 0.7); }
            100% { box-shadow: 0 4px 20px rgba(245, 158, 11, 0.4); }
          }
        `}
      </style>

      {/* Enhanced Help Button */}
      <Tooltip title="Need help? Click to see what you can do here!" placement="left">
        <Fab
          onClick={handleOpen}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1500,
            backgroundColor: isOpen ? '#d97706' : '#f59e0b',
            color: 'white',
            animation: 'helpButtonPulse 2s infinite',
            '&:hover': {
              backgroundColor: '#d97706',
              transform: 'scale(1.15)',
              animation: 'none',
              boxShadow: '0 8px 32px rgba(245, 158, 11, 0.6)',
            },
            transition: 'all 0.3s ease',
            fontSize: '1.2rem',
          }}
        >
          <HelpIcon fontSize="large" />
        </Fab>
      </Tooltip>

      {/* Simple Menu */}
      <Menu
        anchorEl={anchorEl}
        open={isOpen}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            width: 320,
            maxWidth: '90vw',
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
            border: '1px solid #e5e7eb',
            mt: -1,
            mr: 1,
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            px: 3,
            py: 2,
            backgroundColor: '#f59e0b',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
            ✨ How can I help you?
          </Typography>
          <IconButton
            onClick={handleClose}
            size="small"
            sx={{ color: 'white' }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Menu Options */}
        {availableOptions.map((option, index) => (
          <MenuItem
            key={option.id}
            onClick={option.action}
            sx={{
              py: 2,
              px: 3,
              '&:hover': {
                backgroundColor: '#fef3c7',
              },
            }}
          >
            <ListItemIcon sx={{ color: '#f59e0b', minWidth: 40 }}>
              {option.icon}
            </ListItemIcon>
            <ListItemText
              primary={option.label}
              secondary={option.description}
              primaryTypographyProps={{
                fontWeight: 600,
                fontSize: '0.95rem',
              }}
              secondaryTypographyProps={{
                fontSize: '0.8rem',
                color: '#6b7280',
              }}
            />
          </MenuItem>
        ))}

        {/* Footer */}
        <Box
          sx={{
            px: 3,
            py: 1.5,
            backgroundColor: '#f9fafb',
            borderTop: '1px solid #e5e7eb',
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', display: 'block' }}>
            👆 Click any option above to see it highlighted on the page
          </Typography>
        </Box>
      </Menu>
    </>
  );
});

SimpleInteractiveGuide.displayName = 'SimpleInteractiveGuide';

export default SimpleInteractiveGuide;