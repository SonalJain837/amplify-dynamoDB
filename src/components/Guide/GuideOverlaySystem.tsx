import React, { memo, useState, useEffect, useCallback } from 'react';
import {
  Box,
  Portal,
  Typography,
  Fab,
  Tooltip,
  Badge,
  Zoom,
  useTheme,
  alpha,
} from '@mui/material';
import {
  TipsAndUpdates as TipIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import { useUser } from '../../contexts/UserContext';

interface GuideHotspot {
  id: string;
  selector: string;
  title: string;
  description: string;
  category: 'primary' | 'secondary' | 'info';
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

interface GuideOverlaySystemProps {
  isActive: boolean;
  onToggle: (active: boolean) => void;
}

const GuideOverlaySystem: React.FC<GuideOverlaySystemProps> = memo(({ isActive, onToggle }) => {
  const theme = useTheme();
  const { userData } = useUser();
  const [visibleHotspots, setVisibleHotspots] = useState<GuideHotspot[]>([]);
  const [hoveredHotspot, setHoveredHotspot] = useState<string | null>(null);

  // Define contextual hotspots based on current page and user state
  const getAllHotspots = useCallback((): GuideHotspot[] => {
    const currentPath = window.location.pathname;
    const hotspots: GuideHotspot[] = [];

    // Common hotspots available on all pages
    hotspots.push({
      id: 'profile-menu',
      selector: '[data-guide="profile-menu"]',
      title: userData.isSignedIn ? 'Your Account' : 'Sign In / Register',
      description: userData.isSignedIn 
        ? 'Access your profile settings and account options'
        : 'Create an account or sign in to start connecting with travelers',
      category: 'primary',
      position: 'bottom-left',
    });

    // Home page specific hotspots
    if (currentPath === '/') {
      if (userData.isSignedIn) {
        hotspots.push(
          {
            id: 'search-trips',
            selector: '[data-guide="search-input"]',
            title: 'Find Travel Companions',
            description: 'Search for other travelers going to your destination',
            category: 'primary',
            position: 'bottom-right',
          },
          {
            id: 'add-trip',
            selector: '[data-guide="add-trip-button"]',
            title: 'Share Your Trip',
            description: 'Add your travel plans to connect with fellow travelers',
            category: 'primary',
            position: 'bottom-right',
          },
          {
            id: 'travel-details',
            selector: '[data-guide="travel-details"]',
            title: 'Browse Trips',
            description: 'Explore travel opportunities and connect with other travelers',
            category: 'secondary',
            position: 'top-right',
          }
        );
      } else {
        hotspots.push({
          id: 'main-content',
          selector: '[data-guide="main-content"]',
          title: 'Welcome to Travel Together',
          description: 'Discover travel companions and plan amazing journeys together',
          category: 'info',
          position: 'top-right',
        });
      }
    }

    // Messages page specific hotspots
    if (currentPath === '/messages' && userData.isSignedIn) {
      hotspots.push({
        id: 'message-list',
        selector: '[data-guide="message-list"]',
        title: 'Your Conversations',
        description: 'View and manage your conversations with other travelers',
        category: 'primary',
        position: 'top-right',
      });
    }

    // Navigation hotspots
    if (userData.isSignedIn) {
      hotspots.push({
        id: 'messages-nav',
        selector: 'a[href="/messages"]',
        title: 'Messages',
        description: 'Check your messages and chat with travel companions',
        category: 'secondary',
        position: 'bottom-left',
      });
    }

    return hotspots;
  }, [userData.isSignedIn, userData.userDisplayName]);

  // Update visible hotspots when component mounts or page changes
  useEffect(() => {
    if (isActive) {
      const updateHotspots = () => {
        const allHotspots = getAllHotspots();
        const visibleOnes = allHotspots.filter(hotspot => {
          const element = document.querySelector(hotspot.selector);
          return element && isElementVisible(element);
        });
        setVisibleHotspots(visibleOnes);
      };

      updateHotspots();
      
      // Update hotspots when DOM changes (e.g., components mount/unmount)
      const observer = new MutationObserver(updateHotspots);
      observer.observe(document.body, { childList: true, subtree: true });

      // Update hotspots on scroll/resize
      const handleUpdate = () => setTimeout(updateHotspots, 100);
      window.addEventListener('scroll', handleUpdate);
      window.addEventListener('resize', handleUpdate);

      return () => {
        observer.disconnect();
        window.removeEventListener('scroll', handleUpdate);
        window.removeEventListener('resize', handleUpdate);
      };
    } else {
      setVisibleHotspots([]);
    }
  }, [isActive, getAllHotspots]);

  // Check if element is visible in viewport
  const isElementVisible = (element: Element): boolean => {
    const rect = element.getBoundingClientRect();
    const viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
    const viewWidth = Math.max(document.documentElement.clientWidth, window.innerWidth);
    
    return (
      rect.top < viewHeight &&
      rect.bottom > 0 &&
      rect.left < viewWidth &&
      rect.right > 0
    );
  };

  // Get position for hotspot indicator
  const getHotspotPosition = (selector: string, position: string = 'top-right') => {
    const element = document.querySelector(selector);
    if (!element) return { top: 0, left: 0 };

    const rect = element.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    const baseTop = rect.top + scrollTop;
    const baseLeft = rect.left + scrollLeft;

    switch (position) {
      case 'top-left':
        return { top: baseTop - 10, left: baseLeft - 10 };
      case 'top-right':
        return { top: baseTop - 10, left: baseLeft + rect.width - 20 };
      case 'bottom-left':
        return { top: baseTop + rect.height - 20, left: baseLeft - 10 };
      case 'bottom-right':
      default:
        return { top: baseTop + rect.height - 20, left: baseLeft + rect.width - 20 };
    }
  };

  const handleHotspotClick = useCallback((hotspot: GuideHotspot) => {
    const element = document.querySelector(hotspot.selector);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Trigger click if it's a clickable element
      if (element.tagName === 'BUTTON' || element.tagName === 'A') {
        (element as HTMLElement).focus();
        // Add a subtle pulse effect
        (element as HTMLElement).style.animation = 'pulse 1s ease-in-out 2';
      }
    }
  }, []);

  const toggleOverlay = useCallback(() => {
    onToggle(!isActive);
  }, [isActive, onToggle]);

  return (
    <>
      {/* Toggle Button */}
      <Tooltip title={isActive ? 'Hide interactive hotspots' : 'Show interactive hotspots'} placement="left">
        <Badge 
          badgeContent={visibleHotspots.length} 
          color="primary"
          sx={{
            position: 'fixed',
            bottom: 84,
            right: 24,
            zIndex: 1900,
          }}
        >
          <Fab
            onClick={toggleOverlay}
            size="medium"
            sx={{
              backgroundColor: isActive ? '#d97706' : '#ffffff',
              color: isActive ? '#ffffff' : '#f59e0b',
              border: '2px solid #f59e0b',
              '&:hover': {
                backgroundColor: isActive ? '#b45309' : '#fef3c7',
                transform: 'scale(1.05)',
              },
              transition: 'all 0.3s ease',
              boxShadow: isActive 
                ? '0 4px 20px rgba(245, 158, 11, 0.4)' 
                : '0 2px 12px rgba(0, 0, 0, 0.1)',
            }}
          >
            {isActive ? <VisibilityOffIcon /> : <VisibilityIcon />}
          </Fab>
        </Badge>
      </Tooltip>

      {/* Hotspot Indicators */}
      {isActive && (
        <Portal>
          {visibleHotspots.map((hotspot) => {
            const position = getHotspotPosition(hotspot.selector, hotspot.position);
            const isHovered = hoveredHotspot === hotspot.id;
            
            return (
              <Zoom key={hotspot.id} in={true} style={{ transitionDelay: '100ms' }}>
                <Box
                  sx={{
                    position: 'absolute',
                    top: position.top,
                    left: position.left,
                    zIndex: 1800,
                    cursor: 'pointer',
                  }}
                  onMouseEnter={() => setHoveredHotspot(hotspot.id)}
                  onMouseLeave={() => setHoveredHotspot(null)}
                  onClick={() => handleHotspotClick(hotspot)}
                >
                  {/* Hotspot Indicator */}
                  <Box
                    sx={{
                      width: 30,
                      height: 30,
                      borderRadius: '50%',
                      backgroundColor: hotspot.category === 'primary' ? '#f59e0b' : 
                                     hotspot.category === 'secondary' ? '#3b82f6' : '#10b981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                      animation: 'pulse 2s infinite',
                      transform: isHovered ? 'scale(1.2)' : 'scale(1)',
                      transition: 'transform 0.2s ease',
                      '@keyframes pulse': {
                        '0%': {
                          boxShadow: '0 0 0 0 rgba(245, 158, 11, 0.7)',
                        },
                        '70%': {
                          boxShadow: '0 0 0 10px rgba(245, 158, 11, 0)',
                        },
                        '100%': {
                          boxShadow: '0 0 0 0 rgba(245, 158, 11, 0)',
                        },
                      },
                    }}
                  >
                    <TipIcon sx={{ fontSize: 16, color: 'white' }} />
                  </Box>

                  {/* Tooltip */}
                  {isHovered && (
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 40,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: alpha(theme.palette.grey[900], 0.95),
                        color: 'white',
                        p: 2,
                        borderRadius: 2,
                        maxWidth: 250,
                        fontSize: '0.875rem',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                        zIndex: 1900,
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: '100%',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: 0,
                          height: 0,
                          borderLeft: '8px solid transparent',
                          borderRight: '8px solid transparent',
                          borderTop: `8px solid ${alpha(theme.palette.grey[900], 0.95)}`,
                        },
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {hotspot.title}
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        {hotspot.description}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Zoom>
            );
          })}
        </Portal>
      )}

      {/* Global styles for animations */}
      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.1); opacity: 0.8; }
            100% { transform: scale(1); opacity: 1; }
          }
        `}
      </style>
    </>
  );
});

GuideOverlaySystem.displayName = 'GuideOverlaySystem';

export default GuideOverlaySystem;