import React, { memo, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Fab,
  Tooltip,
  Popper,
  Paper,
  Typography,
  IconButton,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Fade,
  Divider,
  Chip,
} from '@mui/material';
import {
  HelpOutline as HelpIcon,
  Close as CloseIcon,
  PlayArrow as PlayIcon,
  Info as InfoIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Message as MessageIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Dashboard as DashboardIcon,
  Navigation as NavigationIcon,
} from '@mui/icons-material';
import { useUser } from '../../contexts/UserContext';
import { useGuide } from '../../hooks/useGuide';

interface GuideHotspot {
  id: string;
  selector: string;
  title: string;
  description: string;
  category: 'navigation' | 'action' | 'information' | 'feature';
  icon: React.ReactNode;
  action?: () => void;
  condition?: () => boolean;
}

interface InteractiveGuideHotspotsProps {
  isActive: boolean;
  onToggle: (active: boolean) => void;
}

const InteractiveGuideHotspots: React.FC<InteractiveGuideHotspotsProps> = memo(({ isActive, onToggle }) => {
  const { userData } = useUser();
  const { startGuide } = useGuide();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [hoveredHotspot, setHoveredHotspot] = useState<string | null>(null);

  // Define interactive hotspots for the entire website
  const hotspots: GuideHotspot[] = useMemo(() => [
    {
      id: 'search-trips',
      selector: '[data-guide="search-input"]',
      title: 'Search for Travel Companions',
      description: 'Find other travelers going to your destination or search for specific routes.',
      category: 'action',
      icon: <SearchIcon />,
      condition: () => true,
    },
    {
      id: 'add-trip',
      selector: '[data-guide="add-trip-button"]',
      title: 'Add Your Trip',
      description: 'Share your travel plans and connect with fellow travelers.',
      category: 'action',
      icon: <AddIcon />,
      condition: () => userData.isSignedIn,
    },
    {
      id: 'profile-menu',
      selector: '[data-guide="profile-menu"]',
      title: 'Profile & Account',
      description: 'Access your profile, settings, and account management.',
      category: 'navigation',
      icon: <PersonIcon />,
      condition: () => true,
    },
    {
      id: 'messages',
      selector: 'a[href="/messages"]',
      title: 'Messages',
      description: 'View and manage your conversations with other travelers.',
      category: 'feature',
      icon: <MessageIcon />,
      condition: () => userData.isSignedIn,
    },
    {
      id: 'dashboard',
      selector: '[data-guide="main-content"]',
      title: 'Travel Dashboard',
      description: 'Your central hub for all travel-related activities and information.',
      category: 'information',
      icon: <DashboardIcon />,
      condition: () => userData.isSignedIn,
    },
    {
      id: 'navigation-menu',
      selector: 'nav, [data-guide="navigation"]',
      title: 'Main Navigation',
      description: 'Navigate between different sections of the application.',
      category: 'navigation',
      icon: <NavigationIcon />,
      condition: () => true,
    },
    {
      id: 'travel-details',
      selector: '[data-guide="travel-details"]',
      title: 'Travel Information',
      description: 'View detailed information about trips, flights, and travel companions.',
      category: 'information',
      icon: <InfoIcon />,
      condition: () => true,
    },
  ], [userData.isSignedIn]);

  // Filter hotspots based on category and conditions
  const filteredHotspots = useMemo(() => {
    return hotspots.filter(hotspot => {
      const categoryMatch = selectedCategory === 'all' || hotspot.category === selectedCategory;
      const conditionMatch = !hotspot.condition || hotspot.condition();
      return categoryMatch && conditionMatch;
    });
  }, [hotspots, selectedCategory]);

  const handleToggleGuide = useCallback(() => {
    onToggle(!isActive);
  }, [isActive, onToggle]);

  const handleOpenMenu = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleCloseMenu = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleStartTour = useCallback(() => {
    handleCloseMenu();
    // Start the appropriate tour based on authentication status
    const flowId = userData.isSignedIn ? 'authenticated-onboarding' : 'unauthenticated-onboarding';
    startGuide(flowId);
  }, [handleCloseMenu, userData.isSignedIn, startGuide]);

  const handleHighlightElement = useCallback((selector: string) => {
    const element = document.querySelector(selector);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Add temporary highlight effect
      const originalStyle = element.getAttribute('style') || '';
      (element as HTMLElement).style.cssText += `
        outline: 3px solid #f59e0b !important;
        outline-offset: 4px !important;
        border-radius: 8px !important;
        transition: all 0.3s ease !important;
      `;

      // Remove highlight after 3 seconds
      setTimeout(() => {
        (element as HTMLElement).style.cssText = originalStyle;
      }, 3000);
    }
  }, []);

  const handleHotspotClick = useCallback((hotspot: GuideHotspot) => {
    if (hotspot.action) {
      hotspot.action();
    } else {
      handleHighlightElement(hotspot.selector);
    }
    handleCloseMenu();
  }, [handleHighlightElement, handleCloseMenu]);

  const categories = [
    { id: 'all', label: 'All Features', count: filteredHotspots.length },
    { id: 'navigation', label: 'Navigation', count: hotspots.filter(h => h.category === 'navigation' && (!h.condition || h.condition())).length },
    { id: 'action', label: 'Actions', count: hotspots.filter(h => h.category === 'action' && (!h.condition || h.condition())).length },
    { id: 'feature', label: 'Features', count: hotspots.filter(h => h.category === 'feature' && (!h.condition || h.condition())).length },
    { id: 'information', label: 'Information', count: hotspots.filter(h => h.category === 'information' && (!h.condition || h.condition())).length },
  ];

  const isMenuOpen = Boolean(anchorEl);

  return (
    <>
      {/* Main Guide Button */}
      <Tooltip title="Interactive Guide - Click to explore features" placement="left">
        <Fab
          onClick={isMenuOpen ? handleCloseMenu : handleOpenMenu}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 2000,
            backgroundColor: isActive || isMenuOpen ? '#f59e0b' : '#ffffff',
            color: isActive || isMenuOpen ? '#ffffff' : '#f59e0b',
            border: '2px solid #f59e0b',
            '&:hover': {
              backgroundColor: '#d97706',
              color: '#ffffff',
              transform: 'scale(1.05)',
            },
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 20px rgba(245, 158, 11, 0.3)',
          }}
        >
          {isMenuOpen ? <CloseIcon /> : <HelpIcon />}
        </Fab>
      </Tooltip>

      {/* Interactive Guide Menu */}
      <Popper
        open={isMenuOpen}
        anchorEl={anchorEl}
        placement="top-end"
        transition
        style={{ zIndex: 2100 }}
      >
        {({ TransitionProps }) => (
          <Fade {...TransitionProps} timeout={200}>
            <Paper
              elevation={8}
              sx={{
                width: 380,
                maxHeight: 500,
                overflow: 'hidden',
                borderRadius: 3,
                border: '1px solid #e5e7eb',
                mb: 2,
                mr: 1,
              }}
            >
              {/* Header */}
              <Box
                sx={{
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: 'white',
                  p: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Interactive Guide
                  </Typography>
                  <IconButton
                    onClick={handleCloseMenu}
                    size="small"
                    sx={{ color: 'white' }}
                  >
                    <CloseIcon />
                  </IconButton>
                </Box>
                <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
                  Discover what you can do on this website
                </Typography>
              </Box>

              {/* Quick Actions */}
              <Box sx={{ p: 2, borderBottom: '1px solid #f3f4f6' }}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<PlayIcon />}
                  onClick={handleStartTour}
                  sx={{
                    borderColor: '#f59e0b',
                    color: '#f59e0b',
                    '&:hover': {
                      backgroundColor: '#fef3c7',
                      borderColor: '#d97706',
                    },
                  }}
                >
                  Start Guided Tour
                </Button>
              </Box>

              {/* Category Filters */}
              <Box sx={{ p: 2, borderBottom: '1px solid #f3f4f6' }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#374151' }}>
                  Explore by Category
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {categories.map((category) => (
                    <Chip
                      key={category.id}
                      label={`${category.label} (${category.count})`}
                      size="small"
                      onClick={() => setSelectedCategory(category.id)}
                      variant={selectedCategory === category.id ? 'filled' : 'outlined'}
                      sx={{
                        backgroundColor: selectedCategory === category.id ? '#f59e0b' : 'transparent',
                        borderColor: '#f59e0b',
                        color: selectedCategory === category.id ? 'white' : '#f59e0b',
                        '&:hover': {
                          backgroundColor: selectedCategory === category.id ? '#d97706' : '#fef3c7',
                        },
                      }}
                    />
                  ))}
                </Box>
              </Box>

              {/* Hotspots List */}
              <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                <List dense>
                  {filteredHotspots.map((hotspot, index) => (
                    <React.Fragment key={hotspot.id}>
                      <ListItem
                        button
                        onClick={() => handleHotspotClick(hotspot)}
                        onMouseEnter={() => setHoveredHotspot(hotspot.id)}
                        onMouseLeave={() => setHoveredHotspot(null)}
                        sx={{
                          '&:hover': {
                            backgroundColor: '#fef3c7',
                          },
                          backgroundColor: hoveredHotspot === hotspot.id ? '#fef3c7' : 'transparent',
                          transition: 'background-color 0.2s ease',
                        }}
                      >
                        <ListItemIcon sx={{ color: '#f59e0b', minWidth: 36 }}>
                          {hotspot.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={hotspot.title}
                          secondary={hotspot.description}
                          primaryTypographyProps={{
                            fontWeight: 600,
                            fontSize: '0.9rem',
                          }}
                          secondaryTypographyProps={{
                            fontSize: '0.8rem',
                            color: '#6b7280',
                          }}
                        />
                      </ListItem>
                      {index < filteredHotspots.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                  {filteredHotspots.length === 0 && (
                    <ListItem>
                      <ListItemText
                        primary="No features available"
                        secondary="Features will appear here based on your current context"
                        primaryTypographyProps={{ textAlign: 'center' }}
                        secondaryTypographyProps={{ textAlign: 'center' }}
                      />
                    </ListItem>
                  )}
                </List>
              </Box>

              {/* Footer */}
              <Box
                sx={{
                  p: 1.5,
                  backgroundColor: '#f9fafb',
                  borderTop: '1px solid #e5e7eb',
                  textAlign: 'center',
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  Click any item above to see it in action
                </Typography>
              </Box>
            </Paper>
          </Fade>
        )}
      </Popper>
    </>
  );
});

InteractiveGuideHotspots.displayName = 'InteractiveGuideHotspots';

export default InteractiveGuideHotspots;