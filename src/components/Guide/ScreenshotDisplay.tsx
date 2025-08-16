import React, { useState } from 'react';
import { Box, Skeleton, Typography } from '@mui/material';

interface ScreenshotDisplayProps {
  screenshot: {
    src: string;
    alt: string;
    responsive?: {
      mobile?: string;
      tablet?: string;
      desktop?: string;
    };
  };
  maxHeight?: number;
}

export const ScreenshotDisplay: React.FC<ScreenshotDisplayProps> = ({
  screenshot,
  maxHeight = 200
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  // Determine which image to show based on screen size
  const getImageSrc = () => {
    if (screenshot.responsive) {
      // Use CSS media queries approach or simple screen width detection
      const width = window.innerWidth;
      if (width < 768 && screenshot.responsive.mobile) {
        return screenshot.responsive.mobile;
      }
      if (width < 1024 && screenshot.responsive.tablet) {
        return screenshot.responsive.tablet;
      }
      if (screenshot.responsive.desktop) {
        return screenshot.responsive.desktop;
      }
    }
    return screenshot.src;
  };

  if (hasError) {
    return (
      <Box
        sx={{
          maxHeight,
          minHeight: 120,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8f9fa',
          border: '2px dashed #dee2e6',
          borderRadius: 2,
          p: 2
        }}
      >
        <Typography variant="body2" color="text.secondary" align="center">
          Screenshot not available
          <br />
          <Typography variant="caption" component="span">
            {screenshot.alt}
          </Typography>
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: 'relative',
        maxHeight,
        overflow: 'hidden',
        borderRadius: 2,
        border: '1px solid rgba(0, 0, 0, 0.1)',
        backgroundColor: '#f8f9fa'
      }}
    >
      {isLoading && (
        <Skeleton
          variant="rectangular"
          width="100%"
          height={maxHeight}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            zIndex: 1
          }}
        />
      )}
      
      <img
        src={getImageSrc()}
        alt={screenshot.alt}
        onLoad={handleImageLoad}
        onError={handleImageError}
        style={{
          width: '100%',
          height: 'auto',
          maxHeight,
          objectFit: 'cover',
          objectPosition: 'top',
          display: isLoading ? 'none' : 'block',
          borderRadius: 8,
          transition: 'opacity 0.3s ease'
        }}
        loading="lazy"
      />

      {/* Optional overlay with screenshot title */}
      {!isLoading && !hasError && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
            p: 1,
            borderRadius: '0 0 8px 8px'
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: 'white',
              fontWeight: 500,
              textShadow: '0 1px 2px rgba(0,0,0,0.5)'
            }}
          >
            {screenshot.alt}
          </Typography>
        </Box>
      )}
    </Box>
  );
};