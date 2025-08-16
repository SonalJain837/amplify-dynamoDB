import React, { useState, useEffect } from 'react';
import { Box, Typography, styled, keyframes } from '@mui/material';

/**
 * Modern, clean redesign of the Step123.gif banner for travel companion finder website.
 * 
 * Features exact content from Step123.gif:
 * - Step 1 – Register
 * - Step 2 – Search  
 * - Step 3 – Find Your Travelmate
 * 
 * Design improvements:
 * - Soft, subtle colors that blend with light theme
 * - Compact, space-efficient layout (6-8% height)
 * - Smooth, gentle animations (4s cycle)
 * - Modern typography with balanced styling
 * - Responsive design for all screen sizes
 * - Non-distracting visual elements
 */

// Subtle floating animation for step items
const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-1px); }
`;

// Gentle slide animation for main content
const slideIn = keyframes`
  0% { opacity: 0; transform: translateY(10px); }
  100% { opacity: 1; transform: translateY(0px); }
`;

// Subtle step highlight animation
const stepGlow = keyframes`
  0%, 100% { 
    box-shadow: 0 2px 12px rgba(245, 158, 11, 0.25);
  }
  50% { 
    box-shadow: 0 3px 16px rgba(245, 158, 11, 0.35);
  }
`;

// Background gradient shift animation like Step123.gif
const backgroundShift = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const BannerContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  paddingBottom: '15%', // Match Step123.gif proportions
  height: 0,
  position: 'relative',
  overflow: 'hidden',
  background: '#FDD835', // Solid bright yellow like Step123.gif
  border: 'none',
  boxShadow: 'none',
  
  // Mobile phones (up to 600px)
  [theme.breakpoints.down('sm')]: {
    paddingBottom: '20%', // Taller on mobile for readability
  },
  
  // Small tablets (600px-960px)
  [theme.breakpoints.between('sm', 'md')]: {
    paddingBottom: '18%',
  },
  
  // Medium tablets and laptops (960px-1280px)
  [theme.breakpoints.between('md', 'lg')]: {
    paddingBottom: '16%',
  },
  
  // Large desktops (1280px-1920px)
  [theme.breakpoints.between('lg', 'xl')]: {
    paddingBottom: '14%',
  },
  
  // Extra large screens (1920px+)
  [theme.breakpoints.up('xl')]: {
    paddingBottom: '12%',
  },
}));

const ContentWrapper = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '12px 20px',
  maxWidth: '1400px',
  margin: '0 auto',
  
  // Mobile phones (up to 600px)
  [theme.breakpoints.down('sm')]: {
    padding: '8px 12px',
  },
  
  // Small tablets (600px-960px)
  [theme.breakpoints.between('sm', 'md')]: {
    padding: '10px 16px',
  },
  
  // Medium tablets and laptops (960px-1280px)
  [theme.breakpoints.between('md', 'lg')]: {
    padding: '12px 24px',
    maxWidth: '1200px',
  },
  
  // Large desktops (1280px-1920px)
  [theme.breakpoints.between('lg', 'xl')]: {
    padding: '14px 32px',
    maxWidth: '1300px',
  },
  
  // Extra large screens (1920px+)
  [theme.breakpoints.up('xl')]: {
    padding: '16px 40px',
    maxWidth: '1400px',
  },
}));

const MainContent = styled(Box)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  animation: `${slideIn} 1.2s ease-out`,
  zIndex: 2,
  
  [theme.breakpoints.down('md')]: {
    padding: '0 16px',
  },
}));

const StepContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '20px',
  width: '100%',
  maxWidth: '800px',
  flexWrap: 'nowrap',
  
  // Extra small mobile (320px-480px)
  [theme.breakpoints.down('sm')]: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: '8px',
    justifyContent: 'center',
    maxWidth: '100%',
    padding: '0 8px',
  },
  
  // Small mobile landscape and portrait tablets (480px-768px)
  [theme.breakpoints.between('sm', 'md')]: {
    gap: '12px',
    maxWidth: '600px',
    flexWrap: 'nowrap',
  },
  
  // Medium tablets and small laptops (768px-1024px)
  [theme.breakpoints.between('md', 'lg')]: {
    gap: '16px',
    maxWidth: '700px',
  },
  
  // Large laptops and desktops (1024px-1440px)
  [theme.breakpoints.between('lg', 'xl')]: {
    gap: '24px',
    maxWidth: '800px',
  },
  
  // Extra large screens (1440px+)
  [theme.breakpoints.up('xl')]: {
    gap: '28px',
    maxWidth: '900px',
  },
}));

const StepItem = styled(Box)<{ delay?: number; isActive?: boolean }>(({ delay = 0, isActive = false, theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '8px 16px',
  borderRadius: '6px',
  background: 'transparent', // Clean like Step123.gif
  border: 'none',
  boxShadow: 'none',
  animation: 'none',
  transition: 'all 0.2s ease',
  cursor: 'default',
  minWidth: 'fit-content',
  flex: '1 1 auto',
  
  '&:hover': {
    transform: 'none', // Keep it simple like the GIF
  },
  
  // Mobile phones (up to 600px)
  [theme.breakpoints.down('sm')]: {
    padding: '6px 12px',
    gap: '6px',
    minWidth: '80px',
    flex: '1 1 30%',
    justifyContent: 'center',
  },
  
  // Small tablets (600px-960px) 
  [theme.breakpoints.between('sm', 'md')]: {
    padding: '7px 14px',
    gap: '7px',
    minWidth: '100px',
    flex: '1 1 auto',
  },
  
  // Medium tablets and laptops (960px-1280px)
  [theme.breakpoints.between('md', 'lg')]: {
    padding: '8px 15px',
    gap: '8px',
    minWidth: '120px',
    flex: '0 1 auto',
  },
  
  // Large desktops (1280px-1920px)
  [theme.breakpoints.between('lg', 'xl')]: {
    padding: '8px 16px',
    gap: '8px',
    minWidth: '140px',
  },
  
  // Extra large screens (1920px+)
  [theme.breakpoints.up('xl')]: {
    padding: '10px 18px',
    gap: '10px',
    minWidth: '160px',
  },
}));

const StepNumber = styled(Box)<{ isActive?: boolean }>(({ isActive = false, theme }) => ({
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  background: isActive 
    ? '#D32F2F' // Red circle for active step like in GIF
    : '#424242', // Dark gray for inactive steps
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white',
  fontWeight: 700,
  fontSize: '0.9rem',
  animation: 'none', // Simple like the GIF
  boxShadow: '0 2px 4px rgba(0,0,0,0.2)', // Simple shadow
  transition: 'all 0.3s ease',
  flexShrink: 0,
  border: 'none',
  
  // Mobile phones (up to 600px)
  [theme.breakpoints.down('sm')]: {
    width: '24px',
    height: '24px',
    fontSize: '0.7rem',
  },
  
  // Small tablets (600px-960px)
  [theme.breakpoints.between('sm', 'md')]: {
    width: '26px',
    height: '26px',
    fontSize: '0.75rem',
  },
  
  // Medium tablets and laptops (960px-1280px)
  [theme.breakpoints.between('md', 'lg')]: {
    width: '30px',
    height: '30px',
    fontSize: '0.85rem',
  },
  
  // Large desktops (1280px-1920px)
  [theme.breakpoints.between('lg', 'xl')]: {
    width: '32px',
    height: '32px',
    fontSize: '0.9rem',
  },
  
  // Extra large screens (1920px+)
  [theme.breakpoints.up('xl')]: {
    width: '36px',
    height: '36px',
    fontSize: '1rem',
  },
}));


const StepText = styled(Typography)<{ isActive?: boolean }>(({ isActive = false, theme }) => ({
  fontWeight: isActive ? 700 : 600,
  fontSize: '1rem',
  color: isActive ? 'rgba(51, 65, 85, 0.95)' : 'rgba(71, 85, 105, 0.85)',
  textAlign: 'left',
  textShadow: '0 1px 2px rgba(255, 255, 255, 0.8)',
  letterSpacing: '0.02em',
  lineHeight: 1.3,
  transition: 'all 0.4s ease',
  whiteSpace: 'nowrap',
  fontFamily: '"Inter", sans-serif',
  
  // Mobile phones (up to 600px)
  [theme.breakpoints.down('sm')]: {
    fontSize: '0.75rem',
    whiteSpace: 'normal',
    textAlign: 'center',
    lineHeight: 1.2,
    letterSpacing: '0.01em',
  },
  
  // Small tablets (600px-960px)
  [theme.breakpoints.between('sm', 'md')]: {
    fontSize: '0.8rem',
    textAlign: 'left',
    whiteSpace: 'nowrap',
    lineHeight: 1.25,
  },
  
  // Medium tablets and laptops (960px-1280px)
  [theme.breakpoints.between('md', 'lg')]: {
    fontSize: '0.9rem',
    lineHeight: 1.3,
  },
  
  // Large desktops (1280px-1920px)
  [theme.breakpoints.between('lg', 'xl')]: {
    fontSize: '0.95rem',
    lineHeight: 1.3,
  },
  
  // Extra large screens (1920px+)
  [theme.breakpoints.up('xl')]: {
    fontSize: '1.05rem',
    lineHeight: 1.4,
  },
}));


// Define the steps data exactly matching Step123.gif content
const stepsData = [
  {
    number: 1,
    text: 'Step 1 – Register'
  },
  {
    number: 2,
    text: 'Step 2 – Search'
  },
  {
    number: 3,
    text: 'Step 3 – Find Your Travelmate'
  }
];

const ModernBanner: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep(prev => (prev + 1) % 3);
    }, 4000); // Slower transition for more subtle animation

    return () => clearInterval(interval);
  }, []);

  return (
    <BannerContainer
      role="banner"
      aria-label="Travel companion finder steps - Create Profile, Discover Destinations, and Connect with Travelers"
    >
      <ContentWrapper>
        
        {/* Main Steps Content */}
        <MainContent>
          <StepContainer>
            {stepsData.map((step, index) => (
              <StepItem 
                key={step.number} 
                delay={index * 0.5}
                isActive={activeStep === index}
              >
                <StepNumber isActive={activeStep === index}>
                  {step.number}
                </StepNumber>
                <StepText isActive={activeStep === index} variant="body2">
                  {step.text}
                </StepText>
              </StepItem>
            ))}
          </StepContainer>
        </MainContent>
      </ContentWrapper>
    </BannerContainer>
  );
};

export default ModernBanner;