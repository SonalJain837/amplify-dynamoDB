import React, { useEffect, useState, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  ButtonGroup,
  LinearProgress,
  Portal,
  Fade,
  IconButton,
  Chip
} from '@mui/material';
import {
  ArrowForward as NextIcon,
  ArrowBack as PrevIcon,
  Close as CloseIcon,
  SkipNext as SkipIcon,
  North as ArrowUpIcon,
  South as ArrowDownIcon,
  East as ArrowRightIcon,
  West as ArrowLeftIcon
} from '@mui/icons-material';
import { GuideStep, GuideTooltipPosition } from '../../types/guide';
import { ScreenshotDisplay } from './ScreenshotDisplay';

interface GuideTooltipProps {
  step: GuideStep;
  currentStepIndex: number;
  totalSteps: number;
  isVisible: boolean;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  onClose: () => void;
}

export const GuideTooltip: React.FC<GuideTooltipProps> = ({
  step,
  currentStepIndex,
  totalSteps,
  isVisible,
  onNext,
  onPrevious,
  onSkip,
  onClose
}) => {
  const [position, setPosition] = useState<GuideTooltipPosition | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const calculatePosition = (): GuideTooltipPosition | null => {
    if (!step.targetSelector) return null;

    const targetElement = document.querySelector(step.targetSelector) as HTMLElement;
    if (!targetElement || !tooltipRef.current) return null;

    const targetRect = targetElement.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    const spacing = 16;
    const arrowSize = 12;
    
    let tooltipPosition: GuideTooltipPosition = {
      top: 0,
      left: 0,
      transform: 'none',
      arrowPosition: 'top',
      arrowOffset: 0
    };

    // Calculate positions based on preferred position
    switch (step.position) {
      case 'top':
        tooltipPosition = {
          top: targetRect.top + scrollTop - tooltipRect.height - spacing - arrowSize,
          left: targetRect.left + scrollLeft + (targetRect.width - tooltipRect.width) / 2,
          transform: 'none',
          arrowPosition: 'bottom',
          arrowOffset: 50
        };
        break;

      case 'bottom':
        tooltipPosition = {
          top: targetRect.bottom + scrollTop + spacing + arrowSize,
          left: targetRect.left + scrollLeft + (targetRect.width - tooltipRect.width) / 2,
          transform: 'none',
          arrowPosition: 'top',
          arrowOffset: 50
        };
        break;

      case 'left':
        tooltipPosition = {
          top: targetRect.top + scrollTop + (targetRect.height - tooltipRect.height) / 2,
          left: targetRect.left + scrollLeft - tooltipRect.width - spacing - arrowSize,
          transform: 'none',
          arrowPosition: 'right',
          arrowOffset: 50
        };
        break;

      case 'right':
        tooltipPosition = {
          top: targetRect.top + scrollTop + (targetRect.height - tooltipRect.height) / 2,
          left: targetRect.right + scrollLeft + spacing + arrowSize,
          transform: 'none',
          arrowPosition: 'left',
          arrowOffset: 50
        };
        break;

      case 'center':
      default:
        tooltipPosition = {
          top: viewportHeight / 2 + scrollTop,
          left: viewportWidth / 2 + scrollLeft,
          transform: 'translate(-50%, -50%)',
          arrowPosition: 'top',
          arrowOffset: 50
        };
        break;
    }

    // Apply custom offset
    if (step.offset) {
      tooltipPosition.top += step.offset.y;
      tooltipPosition.left += step.offset.x;
    }

    // Boundary adjustments
    const tooltipWidth = 320; // Estimated width
    const tooltipHeight = 200; // Estimated height

    // Horizontal boundary checks
    if (tooltipPosition.left < spacing) {
      const diff = spacing - tooltipPosition.left;
      tooltipPosition.left = spacing;
      if (tooltipPosition.arrowPosition === 'top' || tooltipPosition.arrowPosition === 'bottom') {
        tooltipPosition.arrowOffset = Math.max(20, tooltipPosition.arrowOffset - (diff / tooltipWidth) * 100);
      }
    } else if (tooltipPosition.left + tooltipWidth > viewportWidth - spacing) {
      const diff = tooltipPosition.left + tooltipWidth - (viewportWidth - spacing);
      tooltipPosition.left = viewportWidth - spacing - tooltipWidth;
      if (tooltipPosition.arrowPosition === 'top' || tooltipPosition.arrowPosition === 'bottom') {
        tooltipPosition.arrowOffset = Math.min(80, tooltipPosition.arrowOffset + (diff / tooltipWidth) * 100);
      }
    }

    // Vertical boundary checks
    if (tooltipPosition.top < spacing + scrollTop) {
      tooltipPosition.top = spacing + scrollTop;
      if (tooltipPosition.arrowPosition === 'bottom') {
        tooltipPosition.arrowPosition = 'top';
      }
    } else if (tooltipPosition.top + tooltipHeight > viewportHeight + scrollTop - spacing) {
      tooltipPosition.top = viewportHeight + scrollTop - spacing - tooltipHeight;
      if (tooltipPosition.arrowPosition === 'top') {
        tooltipPosition.arrowPosition = 'bottom';
      }
    }

    return tooltipPosition;
  };

  useEffect(() => {
    if (!isVisible) {
      setPosition(null);
      return;
    }

    const updatePosition = () => {
      const newPosition = calculatePosition();
      setPosition(newPosition);
    };

    // Initial calculation
    setTimeout(updatePosition, 50);

    // Update on scroll and resize
    const handleUpdate = () => {
      updatePosition();
    };

    window.addEventListener('scroll', handleUpdate, { passive: true });
    window.addEventListener('resize', handleUpdate, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleUpdate);
      window.removeEventListener('resize', handleUpdate);
    };
  }, [isVisible, step, currentStepIndex]);

  if (!isVisible || !position) return null;

  const progress = ((currentStepIndex + 1) / totalSteps) * 100;
  const hasScreenshot = !!step.screenshot;

  // Get arrow icon based on position
  const getArrowIcon = () => {
    switch (position.arrowPosition) {
      case 'top': return <ArrowUpIcon sx={{ fontSize: 16 }} />;
      case 'bottom': return <ArrowDownIcon sx={{ fontSize: 16 }} />;
      case 'left': return <ArrowLeftIcon sx={{ fontSize: 16 }} />;
      case 'right': return <ArrowRightIcon sx={{ fontSize: 16 }} />;
      default: return null;
    }
  };

  return (
    <Portal>
      <Fade in={isVisible} timeout={300}>
        <Paper
          ref={tooltipRef}
          elevation={16}
          sx={{
            position: 'fixed',
            top: position.top,
            left: position.left,
            transform: position.transform,
            width: hasScreenshot ? 380 : 320,
            maxWidth: 'calc(100vw - 32px)',
            zIndex: 10001,
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
            border: '2px solid rgba(245, 158, 11, 0.3)',
            '&::before': position.arrowPosition !== 'center' ? {
              content: '""',
              position: 'absolute',
              width: 0,
              height: 0,
              border: '8px solid transparent',
              ...(position.arrowPosition === 'top' && {
                top: -16,
                left: `${position.arrowOffset}%`,
                transform: 'translateX(-50%)',
                borderBottomColor: '#fff',
                borderTopWidth: 0
              }),
              ...(position.arrowPosition === 'bottom' && {
                bottom: -16,
                left: `${position.arrowOffset}%`,
                transform: 'translateX(-50%)',
                borderTopColor: '#fff',
                borderBottomWidth: 0
              }),
              ...(position.arrowPosition === 'left' && {
                left: -16,
                top: `${position.arrowOffset}%`,
                transform: 'translateY(-50%)',
                borderRightColor: '#fff',
                borderLeftWidth: 0
              }),
              ...(position.arrowPosition === 'right' && {
                right: -16,
                top: `${position.arrowOffset}%`,
                transform: 'translateY(-50%)',
                borderLeftColor: '#fff',
                borderRightWidth: 0
              })
            } : {}
          }}
        >
          {/* Header */}
          <Box
            sx={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: 'white',
              p: 2.5,
              position: 'relative'
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
              <Box flex={1}>
                <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                  <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
                    {step.title}
                  </Typography>
                  {step.actionRequired && (
                    <Chip
                      label="Action Required"
                      size="small"
                      sx={{
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        fontSize: '0.7rem',
                        height: '20px'
                      }}
                    />
                  )}
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="caption" sx={{ opacity: 0.9 }}>
                    Step {currentStepIndex + 1} of {totalSteps}
                  </Typography>
                  {getArrowIcon() && (
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>
                        Look
                      </Typography>
                      {getArrowIcon()}
                    </Box>
                  )}
                </Box>
              </Box>
              <IconButton
                size="small"
                onClick={onClose}
                sx={{
                  color: 'white',
                  ml: 1,
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {/* Progress Bar */}
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 3,
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              '& .MuiLinearProgress-bar': {
                backgroundColor: '#f59e0b'
              }
            }}
          />

          {/* Content */}
          <Box sx={{ p: 3 }}>
            <Typography
              variant="body1"
              sx={{
                color: 'text.primary',
                lineHeight: 1.6,
                mb: step.screenshot ? 2 : 3,
                fontSize: '0.95rem'
              }}
            >
              {step.description}
            </Typography>

            {step.screenshot && (
              <Box sx={{ mb: 3 }}>
                <ScreenshotDisplay
                  screenshot={step.screenshot}
                  maxHeight={180}
                />
              </Box>
            )}

            {/* Action Buttons */}
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                {currentStepIndex > 0 && (
                  <Button
                    startIcon={<PrevIcon />}
                    onClick={onPrevious}
                    variant="outlined"
                    size="small"
                    sx={{ mr: 1 }}
                  >
                    Previous
                  </Button>
                )}
              </Box>

              <ButtonGroup variant="contained" size="small">
                <Button
                  onClick={onSkip}
                  startIcon={<SkipIcon />}
                  variant="outlined"
                  sx={{
                    borderColor: 'rgba(0, 0, 0, 0.23)',
                    color: 'text.secondary',
                    '&:hover': {
                      borderColor: 'rgba(0, 0, 0, 0.4)',
                      backgroundColor: 'rgba(0, 0, 0, 0.04)'
                    }
                  }}
                >
                  Skip
                </Button>
                <Button
                  onClick={onNext}
                  endIcon={<NextIcon />}
                  sx={{
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)'
                    }
                  }}
                >
                  {currentStepIndex === totalSteps - 1 ? 'Finish' : 'Next'}
                </Button>
              </ButtonGroup>
            </Box>
          </Box>
        </Paper>
      </Fade>
    </Portal>
  );
};