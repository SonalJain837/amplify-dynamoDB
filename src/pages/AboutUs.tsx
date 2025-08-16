import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  Fade,
  Slide,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import Header from '../components/Header';
import Footer from '../components/Footer';

// Modern styled components
const HeroSection = styled(Box)(({ theme }) => ({
  background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
  padding: theme.spacing(8, 0),
  textAlign: 'center',
  position: 'relative',
  overflow: 'hidden',
  
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23FFC107" fill-opacity="0.05"%3E%3Cpath d="m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
    opacity: 0.3,
    zIndex: 1,
  },
  
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(6, 0),
  },
}));

const ModernCard = styled(Card)(({ theme }) => ({
  background: '#ffffff',
  border: '1px solid rgba(0, 0, 0, 0.06)',
  borderRadius: '20px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  overflow: 'hidden',
  position: 'relative',
  height: '100%',
  
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: 'linear-gradient(135deg, #FFC107 0%, #FF9800 100%)',
    transform: 'scaleX(0)',
    transition: 'transform 0.3s ease',
    transformOrigin: 'left',
  },
  
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0 16px 48px rgba(0, 0, 0, 0.15)',
    
    '&::before': {
      transform: 'scaleX(1)',
    },
  },
  
  [theme.breakpoints.down('md')]: {
    borderRadius: '16px',
    '&:hover': {
      transform: 'translateY(-4px)',
    },
  },
}));


const SectionDivider = styled(Box)(({ theme }) => ({
  height: '4px',
  width: '80px',
  background: 'linear-gradient(135deg, #FFC107 0%, #FF9800 100%)',
  borderRadius: '2px',
  margin: '0 auto 2rem',
}));

// Optimized Intersection Observer Hook with performance improvements
const useIntersectionObserver = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const targetRef = useRef(null);

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (prefersReducedMotion) {
      setIsIntersecting(true);
      setHasIntersected(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry.isIntersecting;
        setIsIntersecting(isVisible);
        
        // Once intersected, keep it true for smoother UX
        if (isVisible && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      {
        threshold: 0.15,
        rootMargin: '50px 0px -50px 0px',
        ...options
      }
    );

    const currentTarget = targetRef.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasIntersected, options]);

  return [targetRef, hasIntersected || isIntersecting] as const;
};

const AboutUs: React.FC = () => {
  
  // Intersection observers for animations
  const [heroRef, heroVisible] = useIntersectionObserver();
  const [whyRef, whyVisible] = useIntersectionObserver();
  const [closingRef, closingVisible] = useIntersectionObserver();

  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        background: '#ffffff',
        // Ensure smooth scrolling
        scrollBehavior: 'smooth',
        '@media (prefers-reduced-motion: reduce)': {
          scrollBehavior: 'auto',
        },
      }}
    >
      <Header />
      
      {/* Hero Section */}
      <HeroSection 
        ref={heroRef}
        role="banner"
        aria-labelledby="hero-title"
      >
        <Container maxWidth="lg">
          <Box 
            sx={{ 
              position: 'relative', 
              zIndex: 2,
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? 'translateY(0)' : 'translateY(30px)',
              transition: 'opacity 0.8s ease, transform 0.8s ease',
            }}
          >
            <Typography 
              id="hero-title"
              variant="h1" 
              component="h1"
              sx={{ 
                fontSize: 'clamp(2.2rem, 5.5vw, 3.5rem)',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #2D5A5A 0%, #1E3A5F 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                mb: 3,
                textAlign: 'center',
                lineHeight: 1.1
              }}
            >
              About Us
            </Typography>
            
            <SectionDivider />
            
            <Typography 
              variant="h2" 
              component="p"
              sx={{ 
                fontSize: 'clamp(1.1rem, 2.8vw, 1.4rem)',
                color: '#2D5A5A',
                mb: 4,
                textAlign: 'center',
                lineHeight: 1.6,
                fontWeight: 500,
                maxWidth: '780px',
                mx: 'auto'
              }}
            >
              Namaste! Welcome to TravelersTogether.com – your friendly travel companion finder made especially for seasoned travelers who are young at heart.
            </Typography>
          </Box>
        </Container>
      </HeroSection>

      {/* Main Content Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
        
        {/* Introduction Section */}
        <Slide direction="up" in={heroVisible} timeout={1200}>
          <ModernCard sx={{ mb: { xs: 6, md: 8 } }}>
            <CardContent sx={{ p: { xs: 4, md: 6 } }}>
              <Typography 
                variant="body1" 
                sx={{ 
                  fontSize: 'clamp(1.1rem, 2.5vw, 1.3rem)',
                  color: '#6c757d',
                  lineHeight: 1.8,
                  textAlign: 'center',
                  mb: 3
                }}
              >
                We know that the desire to explore doesn't fade with age—in fact, it only grows stronger. Whether you're planning a peaceful temple visit, a scenic group tour, or your long-dreamed Europe trip, everything is better when you have good company.
              </Typography>
              
              <Typography 
                variant="h5" 
                sx={{ 
                  fontSize: 'clamp(1.3rem, 3vw, 1.8rem)',
                  background: 'linear-gradient(135deg, #1E3A5F 0%, #2D5A5A 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  fontWeight: 700,
                  textAlign: 'center'
                }}
              >
                That's where we come in!
              </Typography>
            </CardContent>
          </ModernCard>
        </Slide>

        {/* What We Offer Section */}
        <ModernCard sx={{ mb: { xs: 6, md: 8 } }}>
          <CardContent sx={{ p: { xs: 4, md: 6 } }}>
            <Typography 
              variant="h2" 
              sx={{ 
                fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
                fontWeight: 700,
                color: '#212529',
                mb: 2,
                textAlign: 'center'
              }}
            >
              What We Offer
            </Typography>
            <SectionDivider />
            
            <Typography 
              variant="body1" 
              sx={{ 
                fontSize: 'clamp(1.1rem, 2.5vw, 1.3rem)',
                color: '#6c757d',
                lineHeight: 1.8,
                textAlign: 'center',
                mb: 4
              }}
            >
              At TravelersTogether.com, we help you:
            </Typography>

            <Box sx={{ maxWidth: '800px', mx: 'auto' }}>
              <Box sx={{ mb: 3, display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Typography sx={{ fontSize: '1.5rem', flexShrink: 0 }}>🧳</Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    fontSize: 'clamp(1rem, 2.3vw, 1.2rem)',
                    color: '#495057',
                    lineHeight: 1.7
                  }}
                >
                  <strong>Find like-minded travel companions</strong> – fellow Indian seniors who enjoy meaningful travel, comfort, and great conversations.
                </Typography>
              </Box>

              <Box sx={{ mb: 3, display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Typography sx={{ fontSize: '1.5rem', flexShrink: 0 }}>📆</Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    fontSize: 'clamp(1rem, 2.3vw, 1.2rem)',
                    color: '#495057',
                    lineHeight: 1.7
                  }}
                >
                  <strong>Plan or join trips</strong> based on your interests, preferred pace, and schedule.
                </Typography>
              </Box>

              <Box sx={{ mb: 3, display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Typography sx={{ fontSize: '1.5rem', flexShrink: 0 }}>🛡️</Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    fontSize: 'clamp(1rem, 2.3vw, 1.2rem)',
                    color: '#495057',
                    lineHeight: 1.7
                  }}
                >
                  <strong>Travel safely and confidently</strong> – with verified profiles and helpful resources to ensure peace of mind.
                </Typography>
              </Box>

              <Box sx={{ mb: 0, display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Typography sx={{ fontSize: '1.5rem', flexShrink: 0 }}>🤝</Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    fontSize: 'clamp(1rem, 2.3vw, 1.2rem)',
                    color: '#495057',
                    lineHeight: 1.7
                  }}
                >
                  <strong>Make lasting friendships</strong> – because some travel companions become lifelong friends (and maybe even travel again together!).
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </ModernCard>

        {/* Why We Started Section */}
        <Box ref={whyRef}>
          <Slide direction="up" in={whyVisible} timeout={1000}>
            <ModernCard sx={{ mb: { xs: 8, md: 12 } }}>
              <CardContent sx={{ p: { xs: 4, md: 8 } }}>
                <Typography 
                  variant="h2" 
                  sx={{ 
                    fontSize: 'clamp(1.8rem, 4vw, 2.5rem)',
                    fontWeight: 700,
                    color: '#212529',
                    mb: 2,
                    textAlign: 'center'
                  }}
                >
                  Why We Started
                </Typography>
                <SectionDivider />
                
                <Typography 
                  variant="body1" 
                  sx={{ 
                    fontSize: 'clamp(1.1rem, 2.5vw, 1.3rem)',
                    color: '#6c757d',
                    lineHeight: 1.8,
                    textAlign: 'center',
                    mb: 4,
                    maxWidth: '800px',
                    mx: 'auto'
                  }}
                >
                  Many seniors want to travel but hesitate because they don't want to go alone. Some are looking for spiritual journeys, some for cultural adventures, and some just want to enjoy nature with company. We created TravelersTogether.com so you never have to ask, "Who will go with me?" again.
                </Typography>
                
                <Typography 
                  variant="body1" 
                  sx={{ 
                    fontSize: 'clamp(1.1rem, 2.5vw, 1.3rem)',
                    color: '#6c757d',
                    lineHeight: 1.8,
                    textAlign: 'center',
                    maxWidth: '800px',
                    mx: 'auto'
                  }}
                >
                  Whether you're retired and ready to explore, or simply want to reconnect with the joy of travel, we're here to help you do it—with the right people, at the right pace.
                </Typography>
              </CardContent>
            </ModernCard>
          </Slide>
        </Box>

        {/* Closing Message */}
        <Box ref={closingRef} sx={{ textAlign: 'center' }}>
          <Fade in={closingVisible} timeout={1000}>
            <Box
              sx={{
                p: { xs: 4, md: 8 },
                background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                borderRadius: '24px',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <Typography 
                variant="h3" 
                sx={{ 
                  fontSize: 'clamp(1.8rem, 5vw, 2.5rem)',
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #2D5A5A 0%, #1E3A5F 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  mb: 2
                }}
              >
                Travel knows no age.
              </Typography>
              
              <Typography 
                variant="h3" 
                sx={{ 
                  fontSize: 'clamp(1.8rem, 5vw, 2.5rem)',
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #FFC107 0%, #FF9800 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                Let's explore the world—together.
              </Typography>
            </Box>
          </Fade>
        </Box>
      </Container>

      <Footer />
    </Box>
  );
};

export default AboutUs;