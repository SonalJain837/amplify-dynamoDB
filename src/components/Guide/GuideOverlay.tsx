import React, { useEffect, useState, useRef } from 'react';
import { Box, Portal } from '@mui/material';
import { SpotlightCoordinates } from '../../types/guide';

interface GuideOverlayProps {
  isVisible: boolean;
  targetSelector: string;
  onOverlayClick?: () => void;
  spotlightPadding?: number;
}

export const GuideOverlay: React.FC<GuideOverlayProps> = ({
  isVisible,
  targetSelector,
  onOverlayClick,
  spotlightPadding = 8
}) => {
  const [spotlight, setSpotlight] = useState<SpotlightCoordinates | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const updateSpotlight = () => {
    if (!targetSelector) {
      setSpotlight(null);
      return;
    }

    const targetElement = document.querySelector(targetSelector) as HTMLElement;
    if (!targetElement) {
      setSpotlight(null);
      return;
    }

    const rect = targetElement.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    // Calculate spotlight coordinates with padding
    const spotlightCoords: SpotlightCoordinates = {
      x: rect.left + scrollLeft - spotlightPadding,
      y: rect.top + scrollTop - spotlightPadding,
      width: rect.width + (spotlightPadding * 2),
      height: rect.height + (spotlightPadding * 2),
      borderRadius: Math.min(8, rect.height / 4, rect.width / 4)
    };

    setSpotlight(spotlightCoords);
  };

  useEffect(() => {
    if (!isVisible) {
      setSpotlight(null);
      return;
    }

    // Initial spotlight calculation
    updateSpotlight();

    // Update spotlight on scroll and resize
    const handleUpdate = () => {
      updateSpotlight();
    };

    const handleResize = () => {
      setTimeout(updateSpotlight, 100); // Debounce resize
    };

    window.addEventListener('scroll', handleUpdate, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });

    // Observer for dynamic content changes
    const observer = new MutationObserver(() => {
      setTimeout(updateSpotlight, 50);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class']
    });

    return () => {
      window.removeEventListener('scroll', handleUpdate);
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, [isVisible, targetSelector, spotlightPadding]);

  if (!isVisible) return null;

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    // Only trigger if clicking the actual overlay, not the spotlight area
    if (event.target === event.currentTarget) {
      onOverlayClick?.();
    }
  };

  return (
    <Portal>
      <Box
        ref={overlayRef}
        onClick={handleOverlayClick}
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          transition: 'all 0.3s ease-in-out',
          cursor: 'default',
          ...(spotlight && {
            // Create spotlight effect using CSS clip-path
            clipPath: `polygon(
              0% 0%, 
              0% 100%, 
              ${spotlight.x}px 100%, 
              ${spotlight.x}px ${spotlight.y}px, 
              ${spotlight.x + spotlight.width}px ${spotlight.y}px, 
              ${spotlight.x + spotlight.width}px ${spotlight.y + spotlight.height}px, 
              ${spotlight.x}px ${spotlight.y + spotlight.height}px, 
              ${spotlight.x}px 100%, 
              100% 100%, 
              100% 0%
            )`,
          })
        }}
      />
      
      {/* Spotlight border effect */}
      {spotlight && (
        <Box
          sx={{
            position: 'fixed',
            left: spotlight.x,
            top: spotlight.y,
            width: spotlight.width,
            height: spotlight.height,
            borderRadius: `${spotlight.borderRadius}px`,
            border: '2px solid #f59e0b',
            boxShadow: '0 0 20px rgba(245, 158, 11, 0.6), inset 0 0 20px rgba(245, 158, 11, 0.1)',
            zIndex: 10000,
            pointerEvents: 'none',
            animation: 'pulse 2s infinite',
            '@keyframes pulse': {
              '0%': {
                boxShadow: '0 0 20px rgba(245, 158, 11, 0.6), inset 0 0 20px rgba(245, 158, 11, 0.1)'
              },
              '50%': {
                boxShadow: '0 0 30px rgba(245, 158, 11, 0.8), inset 0 0 30px rgba(245, 158, 11, 0.2)'
              },
              '100%': {
                boxShadow: '0 0 20px rgba(245, 158, 11, 0.6), inset 0 0 20px rgba(245, 158, 11, 0.1)'
              }
            }
          }}
        />
      )}
    </Portal>
  );
};