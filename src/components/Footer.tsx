import React, { useState, useEffect } from 'react';
import { Box, Typography, Link, Container, IconButton, useTheme, useMediaQuery } from '@mui/material';
import DiamondOutlinedIcon from '@mui/icons-material/DiamondOutlined';
import { useNavigate } from 'react-router-dom';
import TermsModal from './TermsModal';

const Footer: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [openTermsModal, setOpenTermsModal] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Intersection Observer for fade-in animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    const footerElement = document.getElementById('modern-footer');
    if (footerElement) {
      observer.observe(footerElement);
    }

    return () => {
      if (footerElement) {
        observer.unobserve(footerElement);
      }
    };
  }, []);

  const handleOpenTermsModal = () => {
    setOpenTermsModal(true);
  };

  const handleCloseTermsModal = () => {
    setOpenTermsModal(false);
  };

  return (
    <Box
      id="modern-footer"
      component="footer"
      role="contentinfo"
      aria-label="Site footer"
      sx={{
        width: '100%',
        background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
        color: '#ffffff',
        py: { xs: '32px', sm: '36px', md: '40px' },
        pb: { xs: '24px', sm: '28px', md: '32px' },
        px: 0,
        mt: 'auto',
        position: 'relative',
        overflow: 'hidden',
        minHeight: { xs: '220px', sm: '200px', md: '160px' },
        maxHeight: { xs: '250px', sm: '230px', md: '180px' },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '1px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)',
        },
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <Container 
        maxWidth="lg" 
        sx={{ 
          position: 'relative', 
          zIndex: 1,
          display: 'grid',
          gridTemplateAreas: {
            xs: '"brand" "navigation" "copyright"',
            md: '"brand navigation" "copyright copyright"'
          },
          gridTemplateColumns: {
            xs: '1fr',
            md: '1fr auto'
          },
          gap: { xs: '12px', md: '16px 32px' },
          alignItems: { xs: 'start', md: 'center' },
          minHeight: 'auto',
          px: { xs: '20px', sm: '24px', md: '32px' },
          height: '100%'
        }}
      >
        {/* Brand Section */}
        <Box 
          sx={{ 
            gridArea: 'brand',
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'center', md: 'center' },
            textAlign: { xs: 'center', md: 'left' },
            gap: { xs: '8px', md: '12px' }
          }}
        >
          {/* Logo and Brand */}
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: '12px',
              transform: isVisible ? 'scale(1)' : 'scale(0.95)',
              transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.1s'
            }}
          >
            <IconButton
              sx={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#fff',
                width: { xs: 32, md: 36 },
                height: { xs: 32, md: 36 },
                minWidth: { xs: 32, md: 36 },
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 6px 16px rgba(245, 158, 11, 0.4)',
                }
              }}
              aria-label="Travel to World logo"
            >
              <DiamondOutlinedIcon sx={{ fontSize: { xs: 16, md: 18 } }} />
            </IconButton>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <Typography 
                variant="h3" 
                component="h2"
                sx={{ 
                  fontWeight: 600, 
                  color: '#ffffff',
                  fontSize: { xs: '1.5rem', sm: '1.6rem', md: '1.75rem' },
                  letterSpacing: '-0.01em',
                  lineHeight: 1.2,
                  mb: 0
                }}
              >
                Travel to World
              </Typography>
              <Typography 
                variant="body1"
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.8)', 
                  fontSize: { xs: '0.95rem', md: '1rem' },
                  fontWeight: 400,
                  lineHeight: 1.4,
                  opacity: isVisible ? 0.8 : 0,
                  transform: isVisible ? 'translateX(0)' : 'translateX(-10px)',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.2s',
                  margin: 0
                }}
              >
                Explore. Dream. Discover.
              </Typography>
            </Box>
          </Box>

        </Box>

        {/* Navigation Section */}
        <Box 
          sx={{ 
            gridArea: 'navigation',
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'center', md: 'center' },
            justifySelf: { xs: 'center', md: 'end' },
            gap: { xs: '12px', md: '24px' },
            textAlign: { xs: 'center', md: 'right' }
          }}
        >
          
          {/* Navigation Links */}
          <Box 
            component="nav"
            role="navigation"
            aria-label="Footer navigation"
            sx={{
              display: 'flex',
              flexDirection: 'row',
              flexWrap: { xs: 'wrap', md: 'nowrap' },
              gap: { xs: '16px 24px', md: '24px' },
              justifyContent: 'center',
              alignItems: 'center',
              width: '100%',
              maxWidth: { xs: '280px', md: 'none' }
            }}
          >
            {[
              { text: 'About', action: () => navigate('/about') },
              { text: 'Terms', action: handleOpenTermsModal },
              { text: 'Privacy', action: () => {} },
              { text: 'Contact', action: () => navigate('/contact') }
            ].map((link, index) => (
              <Link
                key={link.text}
                component="button"
                onClick={(e) => {
                  e.preventDefault();
                  link.action();
                }}
                sx={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontWeight: 500,
                  fontSize: { xs: '0.95rem', md: '0.95rem' },
                  textDecoration: 'none',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: { xs: '6px 12px', md: '4px 8px' },
                  borderRadius: '4px',
                  minHeight: '44px',
                  minWidth: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
                  transitionDelay: `${0.2 + index * 0.05}s`,
                  '&:hover': {
                    opacity: 1,
                    transform: 'translateY(-1px)',
                    color: '#ffffff'
                  },
                  '&:focus': {
                    outline: '2px solid #f39c12',
                    outlineOffset: '2px',
                    opacity: 1
                  }
                }}
                aria-label={`Navigate to ${link.text} page`}
              >
                {link.text}
              </Link>
            ))}
          </Box>
        </Box>

        {/* Copyright Section */}
        <Box 
          sx={{
            gridArea: 'copyright',
            textAlign: 'center',
            pt: { xs: '16px', sm: '18px', md: '20px' },
            borderTop: '1px solid rgba(255, 255, 255, 0.15)',
            width: '100%'
          }}
        >
          <Typography 
            variant="body2"
            sx={{ 
              color: 'rgba(255, 255, 255, 0.7)', 
              fontSize: { xs: '0.85rem', md: '0.9rem' },
              opacity: isVisible ? 0.7 : 0,
              transform: isVisible ? 'translateY(0)' : 'translateY(5px)',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.3s',
              fontWeight: 400,
              lineHeight: 1.4
            }}
          >
            © Travel to World. All rights reserved.
          </Typography>
        </Box>
      </Container>
      
      <TermsModal open={openTermsModal} onClose={handleCloseTermsModal} />
    </Box>
  );
};

export default Footer; 